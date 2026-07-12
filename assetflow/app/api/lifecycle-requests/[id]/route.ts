import { requireRole } from "@/lib/require-role";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { LifecycleRequestService } from "@/lib/services/lifecycle-request-service";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole([UserRole.ADMIN]);
  if (auth.response) return auth.response;

  const requestId = Number(params.id);
  if (!Number.isInteger(requestId)) {
    return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { action, adminMessage } = body;

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { error: "Invalid action. Must be APPROVE or REJECT.", code: "VALIDATION_FAILED" },
        { status: 400 }
      );
    }

    const result = await LifecycleRequestService.reviewRequest(
      {
        id: auth.user.id,
        role: auth.user.role,
      },
      requestId,
      {
        action,
        adminMessage: adminMessage ? String(adminMessage) : undefined,
      }
    );

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status }
      );
    }

    return NextResponse.json({ request: result.request });
  } catch (error) {
    console.error("Failed to review lifecycle request:", error);
    return NextResponse.json({ error: "Failed to review lifecycle request", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
