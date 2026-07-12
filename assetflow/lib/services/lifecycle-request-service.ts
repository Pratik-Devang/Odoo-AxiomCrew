import { prisma } from "@/lib/prisma";
import { AssetStatus, LifecycleRequestStatus, NotificationType, UserRole } from "@prisma/client";

export class LifecycleRequestService {
  static async submitRequest(
    actor: { id: number; name: string; role: UserRole; departmentId: number | null },
    data: { assetId: number; requestedStatus: AssetStatus; reason: string; notes?: string }
  ) {
    // 1. Basic validation
    if (!data.reason || data.reason.trim().length === 0) {
      return {
        error: "Reason is mandatory.",
        code: "VALIDATION_FAILED",
        status: 400,
      };
    }

    if (!["RETIRED", "LOST", "DISPOSED"].includes(data.requestedStatus)) {
      return {
        error: "Invalid requested lifecycle status. Must be RETIRED, LOST, or DISPOSED.",
        code: "VALIDATION_FAILED",
        status: 400,
      };
    }

    // RBAC: Asset Manager or Department Head only
    if (actor.role !== UserRole.ASSET_MANAGER && actor.role !== UserRole.DEPARTMENT_HEAD) {
      return {
        error: "Forbidden: You are not authorized to create lifecycle requests.",
        code: "FORBIDDEN",
        status: 403,
      };
    }

    try {
      return await prisma.$transaction(async (tx) => {
        // Fetch asset
        const asset = await tx.asset.findUnique({
          where: { id: data.assetId },
        });

        if (!asset) {
          return {
            error: "Asset not found.",
            code: "ASSET_NOT_FOUND",
            status: 404,
          };
        }

        // Validate current status
        if (["RETIRED", "LOST", "DISPOSED"].includes(asset.status)) {
          return {
            error: `Asset is already in a terminal state (${asset.status}).`,
            code: "ASSET_TERMINAL_STATE",
            status: 400,
          };
        }

        // Department Head ownership check
        if (actor.role === UserRole.DEPARTMENT_HEAD) {
          if (asset.departmentId !== actor.departmentId) {
            return {
              error: "Forbidden: You can only submit requests for assets owned by your department.",
              code: "FORBIDDEN",
              status: 403,
            };
          }
        }

        // Check duplicate pending request
        const existingPending = await tx.lifecycleRequest.findFirst({
          where: {
            assetId: data.assetId,
            status: LifecycleRequestStatus.PENDING,
          },
        });

        if (existingPending) {
          return {
            error: "A lifecycle request is already pending for this asset.",
            code: "DUPLICATE_REQUEST",
            status: 409,
          };
        }

        // Check active allocations, bookings, and maintenance if status is RETIRED or DISPOSED
        if (["RETIRED", "DISPOSED"].includes(data.requestedStatus)) {
          // Allocation Check
          const activeAllocation = await tx.allocation.findFirst({
            where: { assetId: data.assetId, status: "ACTIVE" },
          });
          if (activeAllocation) {
            return {
              error: "Asset cannot be retired or disposed while it has an active allocation.",
              code: "ACTIVE_ALLOCATION_PRESENT",
              status: 400,
            };
          }

          // Booking Check
          const activeBooking = await tx.booking.findFirst({
            where: { assetId: data.assetId, status: { in: ["UPCOMING", "ONGOING"] } },
          });
          if (activeBooking) {
            return {
              error: "Asset cannot be retired or disposed while it has active or upcoming bookings.",
              code: "ACTIVE_BOOKING_PRESENT",
              status: 400,
            };
          }

          // Maintenance Check
          const activeMaintenance = await tx.maintenanceRequest.findFirst({
            where: {
              assetId: data.assetId,
              status: { in: ["PENDING", "APPROVED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS"] },
            },
          });
          if (activeMaintenance) {
            return {
              error: "Asset cannot be retired or disposed while maintenance is in progress.",
              code: "MAINTENANCE_IN_PROGRESS",
              status: 400,
            };
          }
        }

        // Create the lifecycle request
        const request = await tx.lifecycleRequest.create({
          data: {
            assetId: data.assetId,
            requestedById: actor.id,
            requestedStatus: data.requestedStatus,
            reason: data.reason,
            notes: data.notes || null,
            status: LifecycleRequestStatus.PENDING,
          },
          include: {
            asset: true,
            requestedBy: true,
          },
        });

        // Notify admins
        const admins = await tx.user.findMany({
          where: { role: UserRole.ADMIN, status: "ACTIVE" },
        });

        for (const admin of admins) {
          await tx.notification.create({
            data: {
              userId: admin.id,
              type: NotificationType.LIFECYCLE_REQUESTED,
              message: `New lifecycle request awaiting approval. ${asset.tag} (${asset.name}) Requested by ${actor.name}`,
              isRead: false,
            },
          });
        }

        // Notify requester
        await tx.notification.create({
          data: {
            userId: actor.id,
            type: NotificationType.LIFECYCLE_REQUESTED,
            message: `Lifecycle request submitted for ${asset.tag} (${asset.name}). Awaiting Admin approval.`,
            isRead: false,
          },
        });

        return { request, status: 201 };
      });
    } catch (err: any) {
      return {
        error: err.message || "Something went wrong while submitting request.",
        code: "INTERNAL_ERROR",
        status: 500,
      };
    }
  }

  static async reviewRequest(
    reviewer: { id: number; role: UserRole },
    requestId: number,
    data: { action: "APPROVE" | "REJECT"; adminMessage?: string }
  ) {
    if (reviewer.role !== UserRole.ADMIN) {
      return {
        error: "Forbidden: Only administrators can review lifecycle requests.",
        code: "FORBIDDEN",
        status: 403,
      };
    }

    if (data.action === "REJECT" && (!data.adminMessage || data.adminMessage.trim().length === 0)) {
      return {
        error: "Admin message is required for rejection.",
        code: "VALIDATION_FAILED",
        status: 400,
      };
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const request = await tx.lifecycleRequest.findUnique({
          where: { id: requestId },
          include: { asset: true, requestedBy: true },
        });

        if (!request) {
          return {
            error: "Lifecycle request not found.",
            code: "REQUEST_NOT_FOUND",
            status: 404,
          };
        }

        if (request.status !== LifecycleRequestStatus.PENDING) {
          return {
            error: `This lifecycle request has already been reviewed (${request.status.toLowerCase()}).`,
            code: "REQUEST_ALREADY_REVIEWED",
            status: 400,
          };
        }

        const finalStatus = data.action === "APPROVE" ? LifecycleRequestStatus.APPROVED : LifecycleRequestStatus.REJECTED;

        // Update lifecycle request status
        const updatedRequest = await tx.lifecycleRequest.update({
          where: { id: requestId },
          data: {
            status: finalStatus,
            adminMessage: data.adminMessage || null,
            reviewedById: reviewer.id,
            reviewedAt: new Date(),
          },
        });

        const asset = request.asset;

        if (data.action === "APPROVE") {
          // Update asset status
          await tx.asset.update({
            where: { id: request.assetId },
            data: { status: request.requestedStatus },
          });

          // Cleanup active allocations/bookings if asset is lost/retired/disposed
          // Let's clean up allocations and bookings regardless of whether it's LOST, RETIRED or DISPOSED (though RETIRED/DISPOSED shouldn't have active ones because of checks, doing this is bulletproof).
          await tx.allocation.updateMany({
            where: { assetId: request.assetId, status: "ACTIVE" },
            data: {
              status: "RETURNED",
              returnedAt: new Date(),
              returnConditionNotes: `Asset marked as ${request.requestedStatus.toLowerCase()} via approved lifecycle request.`,
            },
          });

          await tx.booking.updateMany({
            where: { assetId: request.assetId, status: { in: ["UPCOMING", "ONGOING"] } },
            data: { status: "CANCELLED" },
          });

          // Notify requester of approval
          await tx.notification.create({
            data: {
              userId: request.requestedById,
              type: NotificationType.LIFECYCLE_APPROVED,
              message: `Your request to ${request.requestedStatus.toLowerCase()} ${asset.tag} (${asset.name}) has been approved.${data.adminMessage ? ` Message: ${data.adminMessage}` : ""}`,
              isRead: false,
            },
          });
        } else {
          // Notify requester of rejection
          await tx.notification.create({
            data: {
              userId: request.requestedById,
              type: NotificationType.LIFECYCLE_REJECTED,
              message: `Your request to ${request.requestedStatus.toLowerCase()} ${asset.tag} (${asset.name}) has been rejected. Message: ${data.adminMessage}`,
              isRead: false,
            },
          });
        }

        return { request: updatedRequest, status: 200 };
      });
    } catch (err: any) {
      return {
        error: err.message || "Failed to process lifecycle request review.",
        code: "INTERNAL_ERROR",
        status: 500,
      };
    }
  }
}
