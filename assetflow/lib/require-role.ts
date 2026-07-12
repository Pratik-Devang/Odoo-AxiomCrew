import "server-only";

import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

type RoleGuardResult =
  | { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>; response?: never }
  | { user?: never; response: NextResponse };

type GuardResult =
  | { success: true; response?: never }
  | { success: false; response: NextResponse };

export async function requireRole(allowedRoles: readonly UserRole[]): Promise<RoleGuardResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: "Authentication required", code: "UNAUTHORIZED" }, { status: 401 }),
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      response: NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 }),
    };
  }

  return { user };
}

export async function requireAuthenticated(): Promise<RoleGuardResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: "Authentication required", code: "UNAUTHORIZED" }, { status: 401 }),
    };
  }

  return { user };
}

export function requireOwnerOrManager(
  user: { id: number; role: UserRole },
  ownerId: number
): GuardResult {
  const isManager = user.role === UserRole.ADMIN || user.role === UserRole.ASSET_MANAGER;
  if (isManager || user.id === ownerId) {
    return { success: true };
  }
  return {
    success: false,
    response: NextResponse.json({ error: "Forbidden: You are not authorized for this resource.", code: "FORBIDDEN" }, { status: 403 }),
  };
}

export function requireDepartmentAccess(
  user: { role: UserRole; departmentId: number | null },
  departmentId: number | null
): GuardResult {
  if (user.role === UserRole.ADMIN || user.role === UserRole.ASSET_MANAGER) {
    return { success: true };
  }
  if (user.role === UserRole.DEPARTMENT_HEAD) {
    if (departmentId !== null && user.departmentId === departmentId) {
      return { success: true };
    }
  }
  return {
    success: false,
    response: NextResponse.json({ error: "Forbidden: Department access denied.", code: "FORBIDDEN" }, { status: 403 }),
  };
}

export function requireOwner(
  user: { id: number },
  ownerId: number
): GuardResult {
  if (user.id === ownerId) {
    return { success: true };
  }
  return {
    success: false,
    response: NextResponse.json({ error: "Forbidden: Ownership required.", code: "FORBIDDEN" }, { status: 403 }),
  };
}
