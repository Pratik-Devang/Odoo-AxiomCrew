import { UserRole } from "@prisma/client";

interface UserPayload {
  id: number;
  role: UserRole;
  departmentId: number | null;
}

export function canManageOrganization(user: UserPayload): boolean {
  return user.role === UserRole.ADMIN;
}

export function canManageUsers(user: UserPayload): boolean {
  return user.role === UserRole.ADMIN;
}

export function canRegisterAsset(user: UserPayload): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.ASSET_MANAGER;
}

export function canEditAsset(user: UserPayload): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.ASSET_MANAGER;
}

export function canDeleteAsset(user: UserPayload): boolean {
  return user.role === UserRole.ADMIN;
}

export function canAllocateAsset(user: UserPayload): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.ASSET_MANAGER;
}

export function canReturnAsset(user: UserPayload, allocationOwnerId?: number): boolean {
  const isManager = user.role === UserRole.ADMIN || user.role === UserRole.ASSET_MANAGER;
  if (isManager) return true;
  return !!allocationOwnerId && user.id === allocationOwnerId;
}

export function canTransferAsset(user: UserPayload): boolean {
  return true; // All roles can request a transfer
}

export function canApproveTransfer(user: UserPayload, assetDepartmentId: number | null): boolean {
  if (user.role === UserRole.ADMIN || user.role === UserRole.ASSET_MANAGER) {
    return true;
  }
  if (user.role === UserRole.DEPARTMENT_HEAD && assetDepartmentId !== null) {
    return user.departmentId === assetDepartmentId;
  }
  return false;
}

export function canBookResource(user: UserPayload): boolean {
  return true; // All roles can book resources
}

export function canCancelBooking(user: UserPayload, bookingOwnerId: number): boolean {
  if (user.role === UserRole.ADMIN || user.role === UserRole.ASSET_MANAGER) {
    return true;
  }
  return user.id === bookingOwnerId;
}

export function canRescheduleBooking(user: UserPayload, bookingOwnerId: number): boolean {
  if (user.role === UserRole.ADMIN || user.role === UserRole.ASSET_MANAGER) {
    return true;
  }
  return user.id === bookingOwnerId;
}

export function canRaiseMaintenance(user: UserPayload): boolean {
  return true; // All roles can raise requests
}

export function canApproveMaintenance(user: UserPayload): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.ASSET_MANAGER;
}

export function canResolveMaintenance(user: UserPayload): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.ASSET_MANAGER;
}

export function canRunAudit(user: UserPayload): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.ASSET_MANAGER;
}

export function canViewReports(user: UserPayload, targetDepartmentId?: number | null): boolean {
  if (user.role === UserRole.ADMIN || user.role === UserRole.ASSET_MANAGER) {
    return true;
  }
  if (user.role === UserRole.DEPARTMENT_HEAD) {
    if (targetDepartmentId === undefined) return true; // Scoped reporting allowed
    return targetDepartmentId !== null && user.departmentId === targetDepartmentId;
  }
  return false;
}

export function canExportReports(user: UserPayload): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.ASSET_MANAGER;
}

export function canViewNotifications(user: UserPayload): boolean {
  return true;
}

export function canViewActivityLogs(user: UserPayload): boolean {
  return true;
}
