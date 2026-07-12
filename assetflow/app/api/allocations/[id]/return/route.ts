import { requireRole } from "@/lib/require-role";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { AllocationService } from "@/lib/services/allocation-service";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  const allocationId = Number(params.id);
  if (isNaN(allocationId)) {
    return NextResponse.json({ error: "Invalid allocation ID", code: "VALIDATION_FAILED" }, { status: 400 });
  }

  const allocation = await prisma.allocation.findUnique({
    where: { id: allocationId },
  });

  if (!allocation) {
    return NextResponse.json({ error: "Allocation not found", code: "ALLOCATION_NOT_FOUND" }, { status: 404 });
  }

  const isManager = auth.user.role === UserRole.ADMIN || auth.user.role === UserRole.ASSET_MANAGER;
  if (!isManager && allocation.employeeId !== auth.user.id) {
    return NextResponse.json({ error: "Access Denied: You do not have permission to return this allocation.", code: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { returnConditionNotes } = body;

    const result = await AllocationService.returnAsset(
      auth.user.role,
      allocationId,
      returnConditionNotes || ""
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
    console.error("Return failed:", error);
    return NextResponse.json({ error: "Failed to return asset", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
