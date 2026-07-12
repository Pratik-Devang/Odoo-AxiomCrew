import { requireRole } from "@/lib/require-role";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { TransferService } from "@/lib/services/transfer-service";

import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  const transferId = Number(params.id);
  if (!Number.isInteger(transferId) || transferId <= 0) {
    return NextResponse.json(
      { error: "Invalid transfer request ID", code: "VALIDATION_FAILED" },
      { status: 400 }
    );
  }

  const transfer = await prisma.transferRequest.findUnique({
    where: { id: transferId },
    include: {
      asset: {
        select: {
          currentHolderDepartmentId: true,
          currentHolder: { select: { departmentId: true } },
        },
      },
    },
  });

  if (!transfer) {
    return NextResponse.json({ error: "Transfer request not found", code: "NOT_FOUND" }, { status: 404 });
  }

  // Permission validation
  if (auth.user.role === UserRole.EMPLOYEE) {
    return NextResponse.json({ error: "Access Denied: Employees cannot approve/reject transfers.", code: "FORBIDDEN" }, { status: 403 });
  }

  if (auth.user.role === UserRole.DEPARTMENT_HEAD) {
    const assetDeptId = transfer.asset.currentHolderDepartmentId || transfer.asset.currentHolder?.departmentId;
    if (assetDeptId === null || auth.user.departmentId !== assetDeptId) {
      return NextResponse.json({ error: "Access Denied: Department Heads can only approve transfers for assets belonging to their department.", code: "FORBIDDEN" }, { status: 403 });
    }
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { error: "Action must be APPROVE or REJECT", code: "VALIDATION_FAILED" },
        { status: 400 }
      );
    }

    const result = await TransferService.approveOrRejectTransfer(
      auth.user.id,
      auth.user.role,
      transferId,
      action
    );

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body", code: "VALIDATION_FAILED" }, { status: 400 });
    }
    console.error("Failed to process transfer request:", error);
    return NextResponse.json({ error: "Failed to process transfer request", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
