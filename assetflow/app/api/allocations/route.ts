import { requireRole } from "@/lib/require-role";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { AllocationService } from "@/lib/services/allocation-service";

export async function POST(request: Request) {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { assetId, employeeId, departmentId, expectedReturnDate } = body;

    if (!assetId) {
      return NextResponse.json(
        { error: "assetId is required", code: "VALIDATION_FAILED" },
        { status: 400 }
      );
    }

    const result = await AllocationService.allocate(auth.user.role, {
      assetId: Number(assetId),
      employeeId: employeeId ? Number(employeeId) : null,
      departmentId: departmentId ? Number(departmentId) : null,
      expectedReturnDate: expectedReturnDate || null,
    });

    if ("error" in result) {
      return NextResponse.json(
        { 
          error: result.error, 
          code: result.code, 
          details: "details" in result ? (result as any).details : undefined 
        },
        { status: result.status }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body", code: "VALIDATION_FAILED" }, { status: 400 });
    }
    console.error("Allocation failed:", error);
    return NextResponse.json({ error: "Failed to create allocation", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
