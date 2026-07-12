import { UserRole, MaintenanceStatus, AssetStatus, NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

export const dynamic = "force-dynamic";

const transitionSchema = z.object({
  status: z.nativeEnum(MaintenanceStatus),
  technicianName: z.string().trim().min(2, "Technician name must be at least 2 characters").optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole([UserRole.ASSET_MANAGER, UserRole.ADMIN]);
  if (auth.response) return auth.response;

  try {
    const requestId = parseInt(params.id, 10);
    if (isNaN(requestId)) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = transitionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid fields" },
        { status: 400 }
      );
    }

    const { status: targetStatus, technicianName } = parsed.data;

    // Get the current maintenance request with its asset
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: { asset: true },
    });

    if (!maintenanceRequest) {
      return NextResponse.json({ error: "Maintenance request not found" }, { status: 404 });
    }

    const currentStatus = maintenanceRequest.status;

    // Validate transitions
    if (targetStatus === MaintenanceStatus.APPROVED) {
      if (currentStatus !== MaintenanceStatus.PENDING) {
        return NextResponse.json(
          { error: `Cannot approve request when it is in ${currentStatus} status` },
          { status: 400 }
        );
      }

      // Transition side-effects: set approvedById, update asset.status to UNDER_MAINTENANCE, create notification
      const result = await prisma.$transaction(async (tx) => {
        const updatedRequest = await tx.maintenanceRequest.update({
          where: { id: requestId },
          data: {
            status: targetStatus,
            approvedById: auth.user.id,
          },
        });

        await tx.asset.update({
          where: { id: maintenanceRequest.assetId },
          data: { status: AssetStatus.UNDER_MAINTENANCE },
        });

        await tx.notification.create({
          data: {
            userId: maintenanceRequest.raisedById,
            type: NotificationType.MAINTENANCE_APPROVED,
            message: `Your maintenance request for asset ${maintenanceRequest.asset.tag} (${maintenanceRequest.asset.name}) has been approved.`,
          },
        });

        return updatedRequest;
      });

      return NextResponse.json({ request: result });
    }

    if (targetStatus === MaintenanceStatus.REJECTED) {
      if (currentStatus !== MaintenanceStatus.PENDING) {
        return NextResponse.json(
          { error: `Cannot reject request when it is in ${currentStatus} status` },
          { status: 400 }
        );
      }

      // Transition side-effects: update status, create notification, no asset status changes
      const result = await prisma.$transaction(async (tx) => {
        const updatedRequest = await tx.maintenanceRequest.update({
          where: { id: requestId },
          data: { status: targetStatus },
        });

        await tx.notification.create({
          data: {
            userId: maintenanceRequest.raisedById,
            type: NotificationType.MAINTENANCE_REJECTED,
            message: `Your maintenance request for asset ${maintenanceRequest.asset.tag} (${maintenanceRequest.asset.name}) has been rejected.`,
          },
        });

        return updatedRequest;
      });

      return NextResponse.json({ request: result });
    }

    if (targetStatus === MaintenanceStatus.TECHNICIAN_ASSIGNED) {
      if (currentStatus !== MaintenanceStatus.APPROVED) {
        return NextResponse.json(
          { error: `Cannot assign technician unless the request is APPROVED (currently: ${currentStatus})` },
          { status: 400 }
        );
      }

      if (!technicianName) {
        return NextResponse.json(
          { error: "Technician name is required when assigning a technician" },
          { status: 400 }
        );
      }

      const result = await prisma.maintenanceRequest.update({
        where: { id: requestId },
        data: {
          status: targetStatus,
          technicianName,
        },
      });

      return NextResponse.json({ request: result });
    }

    if (targetStatus === MaintenanceStatus.IN_PROGRESS) {
      if (currentStatus !== MaintenanceStatus.TECHNICIAN_ASSIGNED) {
        return NextResponse.json(
          { error: `Cannot start work unless technician is assigned (currently: ${currentStatus})` },
          { status: 400 }
        );
      }

      const result = await prisma.maintenanceRequest.update({
        where: { id: requestId },
        data: { status: targetStatus },
      });

      return NextResponse.json({ request: result });
    }

    if (targetStatus === MaintenanceStatus.RESOLVED) {
      if (currentStatus !== MaintenanceStatus.IN_PROGRESS) {
        return NextResponse.json(
          { error: `Cannot resolve request unless it is in progress (currently: ${currentStatus})` },
          { status: 400 }
        );
      }

      // Transition side-effects: set resolvedAt = now, update asset.status to AVAILABLE
      const result = await prisma.$transaction(async (tx) => {
        const updatedRequest = await tx.maintenanceRequest.update({
          where: { id: requestId },
          data: {
            status: targetStatus,
            resolvedAt: new Date(),
          },
        });

        await tx.asset.update({
          where: { id: maintenanceRequest.assetId },
          data: { status: AssetStatus.AVAILABLE },
        });

        return updatedRequest;
      });

      return NextResponse.json({ request: result });
    }

    return NextResponse.json(
      { error: `Unsupported target status transition: ${targetStatus}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to update maintenance request:", error);
    return NextResponse.json({ error: "Failed to update maintenance request" }, { status: 500 });
  }
}
