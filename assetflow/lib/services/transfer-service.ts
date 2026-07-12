import { prisma } from "@/lib/prisma";
import { AllocationStatus, AssetStatus, TransferRequestStatus, UserRole } from "@prisma/client";
import { NotificationService } from "./notification-service";

export class TransferService {
  static async submitTransferRequest(
    actorId: number,
    data: { assetId: number; toEmployeeId: number; reason: string }
  ) {
    if (data.reason.trim().length < 5) {
      return {
        error: "Reason must be at least 5 characters long.",
        code: "VALIDATION_FAILED",
        status: 400,
      };
    }

    try {
      return await prisma.$transaction(async (tx) => {
        // Find asset
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

        // Active allocation is source of truth
        const activeAllocation = await tx.allocation.findFirst({
          where: {
            assetId: data.assetId,
            status: AllocationStatus.ACTIVE,
          },
        });

        if (!activeAllocation) {
          return {
            error: "Cannot request transfer: This asset is not currently allocated.",
            code: "ASSET_NOT_ALLOCATED",
            status: 409,
          };
        }

        if (!activeAllocation.employeeId) {
          return {
            error: "Cannot request transfer: This asset is allocated to a department, not an employee.",
            code: "TRANSFER_INVALID_TARGET",
            status: 409,
          };
        }

        if (activeAllocation.employeeId === data.toEmployeeId) {
          return {
            error: "Cannot transfer an asset to its current holder.",
            code: "TRANSFER_INVALID_TARGET",
            status: 400,
          };
        }

        // Check for duplicate pending requests
        const existingPending = await tx.transferRequest.findFirst({
          where: {
            assetId: data.assetId,
            status: TransferRequestStatus.REQUESTED,
          },
        });

        if (existingPending) {
          return {
            error: "A transfer request is already pending for this asset.",
            code: "TRANSFER_ALREADY_PENDING",
            status: 409,
          };
        }

        // Verify target employee exists and is active
        const toEmployee = await tx.user.findUnique({
          where: { id: data.toEmployeeId },
          select: { id: true, status: true },
        });

        if (!toEmployee || toEmployee.status !== "ACTIVE") {
          return {
            error: "Selected recipient does not exist or is inactive.",
            code: "EMPLOYEE_NOT_FOUND",
            status: 400,
          };
        }

        // Create transfer request
        const transferRequest = await tx.transferRequest.create({
          data: {
            assetId: data.assetId,
            fromEmployeeId: activeAllocation.employeeId,
            toEmployeeId: data.toEmployeeId,
            reason: data.reason,
            status: TransferRequestStatus.REQUESTED,
          },
          include: {
            asset: { select: { name: true, tag: true } },
            fromEmployee: { select: { name: true } },
            toEmployee: { select: { name: true } },
          },
        });

        return {
          success: true,
          transferRequest,
        };
      });
    } catch (err) {
      console.error("Submit transfer request failed:", err);
      return {
        error: "Internal server error occurred.",
        code: "DATABASE_ERROR",
        status: 500,
      };
    }
  }

  static async approveOrRejectTransfer(
    actorId: number,
    actorRole: UserRole,
    transferId: number,
    action: "APPROVE" | "REJECT"
  ) {
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD];
    if (!allowedRoles.includes(actorRole)) {
      return {
        error: "You do not have permission to approve or reject transfer requests.",
        code: "PERMISSION_DENIED",
        status: 403,
      };
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Fetch request
        const transferRequest = await tx.transferRequest.findUnique({
          where: { id: transferId },
          include: {
            asset: { select: { name: true, tag: true, currentHolderId: true } },
          },
        });

        if (!transferRequest) {
          return {
            error: "Transfer request not found.",
            code: "TRANSFER_REQUEST_NOT_FOUND",
            status: 404,
          };
        }

        if (transferRequest.status !== TransferRequestStatus.REQUESTED) {
          return {
            error: "This transfer request has already been processed.",
            code: "TRANSFER_INVALID_STATE",
            status: 409,
          };
        }

        // Fetch active allocation
        const activeAllocation = await tx.allocation.findFirst({
          where: {
            assetId: transferRequest.assetId,
            status: AllocationStatus.ACTIVE,
          },
        });

        // Concurrency Check: Verify active allocation still exists, holder is same as requested
        if (
          !activeAllocation ||
          activeAllocation.employeeId !== transferRequest.fromEmployeeId ||
          transferRequest.asset.currentHolderId !== transferRequest.fromEmployeeId
        ) {
          return {
            error: "The asset state or holder has changed since this request was made. Approval is rejected.",
            code: "TRANSFER_STALE_REQUEST",
            status: 409,
          };
        }

        if (action === "REJECT") {
          const updatedRequest = await tx.transferRequest.update({
            where: { id: transferId },
            data: {
              status: TransferRequestStatus.REJECTED,
              decidedAt: new Date(),
              decidedById: actorId,
            },
          });

          return {
            success: true,
            transferRequest: updatedRequest,
          };
        }

        // Else, Action is APPROVE
        const toEmployee = await tx.user.findUnique({
          where: { id: transferRequest.toEmployeeId },
          select: { id: true, name: true, departmentId: true },
        });

        if (!toEmployee) {
          return {
            error: "Target recipient employee not found.",
            code: "EMPLOYEE_NOT_FOUND",
            status: 400,
          };
        }

        // Close old allocation
        await tx.allocation.update({
          where: { id: activeAllocation.id },
          data: {
            status: AllocationStatus.TRANSFERRED,
            returnedAt: new Date(),
          },
        });

        // Create new allocation
        const newAllocation = await tx.allocation.create({
          data: {
            assetId: transferRequest.assetId,
            employeeId: transferRequest.toEmployeeId,
            status: AllocationStatus.ACTIVE,
          },
        });

        // Update Asset
        await tx.asset.update({
          where: { id: transferRequest.assetId },
          data: {
            status: AssetStatus.ALLOCATED,
            currentHolderId: transferRequest.toEmployeeId,
            currentHolderDepartmentId: toEmployee.departmentId,
          },
        });

        // Update request status
        const updatedRequest = await tx.transferRequest.update({
          where: { id: transferId },
          data: {
            status: TransferRequestStatus.APPROVED,
            decidedAt: new Date(),
            decidedById: actorId,
          },
        });

        return {
          success: true,
          transferRequest: updatedRequest,
          newAllocation,
          fromEmployeeId: transferRequest.fromEmployeeId,
          toEmployeeId: transferRequest.toEmployeeId,
          assetTag: transferRequest.asset.tag,
          assetName: transferRequest.asset.name,
        };
      });

      // Send notifications asynchronously outside the transaction commit
      if ('success' in result && result.success && action === "APPROVE") {
        NotificationService.notifyTransferApproved(
          result.fromEmployeeId!,
          result.toEmployeeId!,
          result.assetTag!,
          result.assetName!
        );
      }

      return result;
    } catch (err) {
      console.error("Process transfer transaction failed:", err);
      return {
        error: "Internal server error occurred.",
        code: "DATABASE_ERROR",
        status: 500,
      };
    }
  }
}
