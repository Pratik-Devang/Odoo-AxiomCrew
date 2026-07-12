import { UserRole, AuditCycleStatus, AuditVerification, AssetStatus, NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole([UserRole.ASSET_MANAGER, UserRole.ADMIN]);
  if (auth.response) return auth.response;

  try {
    const cycleId = parseInt(params.id, 10);
    if (isNaN(cycleId)) {
      return NextResponse.json({ error: "Invalid cycle ID" }, { status: 400 });
    }

    const cycle = await prisma.auditCycle.findUnique({
      where: { id: cycleId },
      include: {
        items: {
          select: {
            id: true,
            assetId: true,
            verification: true,
            asset: {
              select: {
                tag: true,
              },
            },
          },
        },
      },
    });

    if (!cycle) {
      return NextResponse.json({ error: "Audit cycle not found" }, { status: 404 });
    }

    if (cycle.status === AuditCycleStatus.CLOSED) {
      return NextResponse.json({ error: "Audit cycle is already closed" }, { status: 400 });
    }

    // Run transaction
    const closedCycle = await prisma.$transaction(async (tx) => {
      // 1. Mark cycle as closed
      const updatedCycle = await tx.auditCycle.update({
        where: { id: cycleId },
        data: { status: AuditCycleStatus.CLOSED },
      });

      // 2. Identify missing items & update their assets to LOST status
      const missingItems = cycle.items.filter((item) => item.verification === AuditVerification.MISSING);
      
      if (missingItems.length > 0) {
        const assetIdsToMarkLost = missingItems.map((item) => item.assetId);
        await tx.asset.updateMany({
          where: { id: { in: assetIdsToMarkLost } },
          data: { status: AssetStatus.LOST },
        });
      }

      // 3. Find asset managers to notify
      const managers = await tx.user.findMany({
        where: {
          role: UserRole.ASSET_MANAGER,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      // 4. Create notifications for each manager if there are discrepancies
      // Note: A discrepancy report is generated if there are missing or damaged items.
      const hasDiscrepancies = cycle.items.some(
        (item) => item.verification === AuditVerification.MISSING || item.verification === AuditVerification.DAMAGED
      );

      if (hasDiscrepancies && managers.length > 0) {
        const missingCount = missingItems.length;
        const damagedCount = cycle.items.filter((item) => item.verification === AuditVerification.DAMAGED).length;

        await tx.notification.createMany({
          data: managers.map((manager) => ({
            userId: manager.id,
            type: NotificationType.AUDIT_DISCREPANCY,
            message: `Discrepancy report: Audit cycle "${cycle.title}" has been closed with ${missingCount} missing and ${damagedCount} damaged assets flagged.`,
          })),
        });
      }

      return updatedCycle;
    });

    return NextResponse.json({ cycle: closedCycle });
  } catch (error) {
    console.error("Failed to close audit cycle:", error);
    return NextResponse.json({ error: "Failed to close audit cycle" }, { status: 500 });
  }
}
