import { UserRole, AuditCycleStatus, AuditVerification, AssetStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

export const dynamic = "force-dynamic";

const createCycleSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  scopeDepartmentId: z.number().nullable().optional(),
  scopeLocation: z.string().trim().nullable().optional(),
  startDate: z.string(),
  endDate: z.string(),
  auditorIds: z.array(z.number()).min(1, "Assign at least one auditor"),
});

export async function GET() {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  try {
    const cycles = await prisma.auditCycle.findMany({
      include: {
        scopeDepartment: {
          select: {
            id: true,
            name: true,
          },
        },
        auditors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        items: {
          include: {
            asset: {
              select: {
                id: true,
                tag: true,
                name: true,
                location: true,
                status: true,
              },
            },
            verifiedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      { cycles },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Failed to fetch audit cycles:", error);
    return NextResponse.json({ error: "Failed to fetch audit cycles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRole([UserRole.ASSET_MANAGER, UserRole.ADMIN]);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const parsed = createCycleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid fields" },
        { status: 400 }
      );
    }

    const { title, scopeDepartmentId, scopeLocation, startDate, endDate, auditorIds } = parsed.data;

    // Build the query to find scoped assets
    const assetWhereClause: any = {
      status: {
        notIn: [AssetStatus.RETIRED, AssetStatus.DISPOSED],
      },
    };

    if (scopeDepartmentId) {
      assetWhereClause.currentHolderDepartmentId = scopeDepartmentId;
    }

    if (scopeLocation && scopeLocation.trim()) {
      assetWhereClause.location = {
        contains: scopeLocation.trim(),
        mode: "insensitive",
      };
    }

    // Fetch the scoped assets
    const scopedAssets = await prisma.asset.findMany({
      where: assetWhereClause,
      select: {
        id: true,
        location: true,
      },
    });

    if (scopedAssets.length === 0) {
      return NextResponse.json(
        { error: "No active assets match the specified scope (department/location). Cannot create cycle." },
        { status: 400 }
      );
    }

    // Perform database operations in transaction
    const cycle = await prisma.$transaction(async (tx) => {
      // 1. Create the AuditCycle
      const newCycle = await tx.auditCycle.create({
        data: {
          title,
          scopeDepartmentId: scopeDepartmentId || null,
          scopeLocation: scopeLocation || null,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: AuditCycleStatus.OPEN,
        },
      });

      // 2. Create the AuditAuditors relations
      await tx.auditAuditor.createMany({
        data: auditorIds.map((userId) => ({
          auditCycleId: newCycle.id,
          userId,
        })),
      });

      // 3. Create the AuditItems for each scoped asset
      await tx.auditItem.createMany({
        data: scopedAssets.map((asset) => ({
          auditCycleId: newCycle.id,
          assetId: asset.id,
          expectedLocation: asset.location || "Unknown",
          verification: AuditVerification.PENDING,
        })),
      });

      return newCycle;
    });

    return NextResponse.json({ cycle }, { status: 201 });
  } catch (error) {
    console.error("Failed to create audit cycle:", error);
    return NextResponse.json({ error: "Failed to create audit cycle" }, { status: 500 });
  }
}
