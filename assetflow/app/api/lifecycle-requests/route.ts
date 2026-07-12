import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { LifecycleRequestService } from "@/lib/services/lifecycle-request-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireRole([UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD]);
  if (auth.response) return auth.response;

  try {
    const where: any = {};

    if (auth.user.role === UserRole.ASSET_MANAGER) {
      where.requestedById = auth.user.id;
    } else if (auth.user.role === UserRole.DEPARTMENT_HEAD) {
      if (auth.user.departmentId === null) {
        return NextResponse.json({ requests: [] }, { headers: { "Cache-Control": "no-store, max-age=0" } });
      }
      where.requestedBy = {
        departmentId: auth.user.departmentId,
      };
    }

    const requests = await prisma.lifecycleRequest.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            tag: true,
            name: true,
            status: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            role: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ requests }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Failed to fetch lifecycle requests:", error);
    return NextResponse.json({ error: "Failed to fetch lifecycle requests", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRole([UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD]);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { assetId, requestedStatus, reason, notes } = body;

    const result = await LifecycleRequestService.submitRequest(
      {
        id: auth.user.id,
        name: auth.user.name,
        role: auth.user.role,
        departmentId: auth.user.departmentId,
      },
      {
        assetId: Number(assetId),
        requestedStatus,
        reason: String(reason),
        notes: notes ? String(notes) : undefined,
      }
    );

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status }
      );
    }

    return NextResponse.json({ request: result.request }, { status: 201 });
  } catch (error) {
    console.error("Failed to create lifecycle request:", error);
    return NextResponse.json({ error: "Failed to create lifecycle request", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
