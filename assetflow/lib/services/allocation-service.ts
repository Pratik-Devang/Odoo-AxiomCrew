import { prisma } from "@/lib/prisma";
import { AllocationStatus, AssetStatus, UserRole } from "@prisma/client";
import { NotificationService } from "./notification-service";

export class AllocationService {
  static async allocate(
    actorRole: UserRole,
    data: {
      assetId: number;
      employeeId: number | null;
      departmentId: number | null;
      expectedReturnDate: string | null;
    }
  ) {
    // 1. Validation
    if (!data.employeeId && !data.departmentId) {
      return {
        error: "Must specify either an employee or a department for allocation.",
        code: "VALIDATION_FAILED",
        status: 400,
      };
    }
    if (data.employeeId && data.departmentId) {
      return {
        error: "Cannot allocate to both an employee and a department simultaneously.",
        code: "VALIDATION_FAILED",
        status: 400,
      };
    }

    if (data.expectedReturnDate) {
      const returnDate = new Date(data.expectedReturnDate);
      if (isNaN(returnDate.getTime()) || returnDate <= new Date()) {
        return {
          error: "Expected return date must be in the future.",
          code: "VALIDATION_FAILED",
          status: 400,
        };
      }
    }

    // Run within a Prisma transaction to prevent race conditions (double allocation)
    try {
      const result = await prisma.$transaction(async (tx) => {
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

        // Verify not retired, disposed, lost
        if (["RETIRED", "DISPOSED", "LOST"].includes(asset.status)) {
          return {
            error: `Asset is currently ${asset.status.toLowerCase()} and cannot be allocated.`,
            code: "ASSET_INVALID_STATUS",
            status: 400,
          };
        }

        // Check active allocation (Source of Truth)
        const activeAllocation = await tx.allocation.findFirst({
          where: {
            assetId: data.assetId,
            status: AllocationStatus.ACTIVE,
          },
          include: {
            employee: { select: { id: true, name: true, department: { select: { name: true } } } },
            department: { select: { id: true, name: true } },
          },
        });

        if (activeAllocation) {
          const holderName = activeAllocation.employee?.name || activeAllocation.department?.name || "Unknown";
          const deptName = activeAllocation.employee?.department?.name || activeAllocation.department?.name || "";
          return {
            error: `Asset is already allocated.`,
            code: "ASSET_ALREADY_ALLOCATED",
            status: 409,
            details: {
              currentHolder: {
                id: activeAllocation.employeeId || activeAllocation.departmentId,
                type: activeAllocation.employeeId ? "EMPLOYEE" : "DEPARTMENT",
                name: holderName,
                department: deptName,
              },
            },
          };
        }

        let currentHolderDeptId = data.departmentId;

        // Verify target employee exists and is active
        if (data.employeeId) {
          const employee = await tx.user.findUnique({
            where: { id: data.employeeId },
            select: { id: true, status: true, departmentId: true },
          });

          if (!employee || employee.status !== "ACTIVE") {
            return {
              error: "Selected employee is inactive or does not exist.",
              code: "EMPLOYEE_NOT_FOUND",
              status: 400,
            };
          }
          currentHolderDeptId = employee.departmentId;
        }

        // Verify target department exists and is active
        if (data.departmentId) {
          const dept = await tx.department.findUnique({
            where: { id: data.departmentId },
            select: { id: true, status: true },
          });

          if (!dept || dept.status !== "ACTIVE") {
            return {
              error: "Selected department is inactive or does not exist.",
              code: "DEPARTMENT_NOT_FOUND",
              status: 400,
            };
          }
        }

        // Perform transactional update
        const updatedAsset = await tx.asset.update({
          where: { id: data.assetId },
          data: {
            status: AssetStatus.ALLOCATED,
            currentHolderId: data.employeeId,
            currentHolderDepartmentId: currentHolderDeptId,
          },
        });

        const newAllocation = await tx.allocation.create({
          data: {
            assetId: data.assetId,
            employeeId: data.employeeId,
            departmentId: data.departmentId,
            expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
            status: AllocationStatus.ACTIVE,
          },
        });

        return {
          success: true,
          allocation: newAllocation,
          asset: updatedAsset,
        };
      });

      if ('success' in result && result.success && data.employeeId) {
        // Trigger notification asynchronously outside the transaction commit block
        NotificationService.notifyAssigned(
          data.employeeId,
          result.asset.tag,
          result.asset.name
        );
      }

      return result;
    } catch (err) {
      console.error("Allocation transaction failed:", err);
      return {
        error: "Internal database error occurred during allocation.",
        code: "DATABASE_ERROR",
        status: 500,
      };
    }
  }

  static async returnAsset(
    actorRole: UserRole,
    allocationId: number,
    returnConditionNotes: string
  ) {
    // Permission check
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD];
    if (!allowedRoles.includes(actorRole)) {
      return {
        error: "You do not have permission to mark assets as returned.",
        code: "PERMISSION_DENIED",
        status: 403,
      };
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const allocation = await tx.allocation.findUnique({
          where: { id: allocationId },
        });

        if (!allocation || allocation.status !== AllocationStatus.ACTIVE) {
          return {
            error: "Active allocation record not found or already returned.",
            code: "ALLOCATION_NOT_FOUND",
            status: 404,
          };
        }

        // Close the allocation
        const updatedAllocation = await tx.allocation.update({
          where: { id: allocationId },
          data: {
            status: AllocationStatus.RETURNED,
            returnedAt: new Date(),
            returnConditionNotes,
          },
        });

        // Set the asset as available
        const updatedAsset = await tx.asset.update({
          where: { id: allocation.assetId },
          data: {
            status: AssetStatus.AVAILABLE,
            currentHolderId: null,
            currentHolderDepartmentId: null,
          },
        });

        return {
          allocation: updatedAllocation,
          asset: updatedAsset,
        };
      });
    } catch (err) {
      console.error("Return transaction failed:", err);
      return {
        error: "Internal database error occurred during return.",
        code: "DATABASE_ERROR",
        status: 500,
      };
    }
  }
}
