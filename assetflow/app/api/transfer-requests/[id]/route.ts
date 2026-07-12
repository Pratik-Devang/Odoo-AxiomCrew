import { requireRole } from "@/lib/require-role";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { TransferService } from "@/lib/services/transfer-service";

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
