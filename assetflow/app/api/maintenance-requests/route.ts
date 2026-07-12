import { UserRole, MaintenancePriority, MaintenanceStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

export const dynamic = "force-dynamic";

const createRequestSchema = z.object({
  assetId: z.number(),
  issueDescription: z.string().trim().min(3, "Description must be at least 3 characters"),
  priority: z.nativeEnum(MaintenancePriority),
  photoUrl: z.string().trim().url("Invalid photo URL format").optional().or(z.literal("")),
});

export async function GET(request: Request) {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const assetIdStr = searchParams.get("assetId");

    const where: any = {};
    if (assetIdStr) {
      const assetId = parseInt(assetIdStr, 10);
      if (!isNaN(assetId)) {
        where.assetId = assetId;
      }
    }

    if (auth.user.role === UserRole.DEPARTMENT_HEAD) {
      if (auth.user.departmentId === null) {
        return NextResponse.json({ requests: [] }, { headers: { "Cache-Control": "no-store, max-age=0" } });
      }
      where.OR = [
        { asset: { currentHolderDepartmentId: auth.user.departmentId } },
        { asset: { currentHolder: { departmentId: auth.user.departmentId } } },
      ];
    } else if (auth.user.role === UserRole.EMPLOYEE) {
      where.raisedById = auth.user.id;
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            tag: true,
            name: true,
            status: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        raisedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { raisedAt: "desc" },
    });

    return NextResponse.json(
      { requests },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Failed to fetch maintenance requests:", error);
    return NextResponse.json({ error: "Failed to fetch maintenance requests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const parsed = createRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid fields" },
        { status: 400 }
      );
    }

    const { assetId, issueDescription, priority, photoUrl } = parsed.data;

    // Check if the asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Verify not retired, disposed, lost
    if (["RETIRED", "DISPOSED", "LOST"].includes(asset.status)) {
      return NextResponse.json(
        { error: `Asset is currently ${asset.status.toLowerCase()} and cannot undergo maintenance.` },
        { status: 400 }
      );
    }

    // Check for pending lifecycle request
    const pendingRequest = await prisma.lifecycleRequest.findFirst({
      where: {
        assetId,
        status: "PENDING",
      },
    });

    if (pendingRequest) {
      return NextResponse.json(
        { error: `Asset has a pending lifecycle request (${pendingRequest.requestedStatus.toLowerCase()}) and cannot undergo maintenance.` },
        { status: 400 }
      );
    }

    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        assetId,
        raisedById: auth.user.id,
        issueDescription,
        priority,
        status: MaintenanceStatus.PENDING,
        photoUrl: photoUrl || null,
      },
      include: {
        asset: {
          select: {
            tag: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ request: maintenanceRequest }, { status: 201 });
  } catch (error) {
    console.error("Failed to create maintenance request:", error);
    return NextResponse.json({ error: "Failed to create maintenance request" }, { status: 500 });
  }
}
