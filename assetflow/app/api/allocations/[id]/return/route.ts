import { requireRole } from "@/lib/require-role";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { AllocationService } from "@/lib/services/allocation-service";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  const allocationId = Number(params.id);
  if (!Number.isInteger(allocationId) || allocationId <= 0) {
    return NextResponse.json(
      { error: "Invalid allocation ID", code: "VALIDATION_FAILED" },
      { status: 400 }
    );
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
