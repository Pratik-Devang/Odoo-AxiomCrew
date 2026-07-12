import { requireRole } from "@/lib/require-role";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { BookingService } from "@/lib/services/booking-service";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  const bookingId = Number(params.id);
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return NextResponse.json(
      { error: "Invalid booking ID", code: "VALIDATION_FAILED" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { action, startTime, endTime } = body;

    if (action === "CANCEL") {
      const result = await BookingService.cancelBooking(auth.user.id, auth.user.role, bookingId);
      if ("error" in result) {
        return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
      }
      return NextResponse.json(result);
    }

    if (action === "RESCHEDULE") {
      if (!startTime || !endTime) {
        return NextResponse.json(
          { error: "startTime and endTime are required for rescheduling.", code: "VALIDATION_FAILED" },
          { status: 400 }
        );
      }

      const result = await BookingService.rescheduleBooking(auth.user.id, auth.user.role, bookingId, {
        startTime,
        endTime,
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
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Action must be CANCEL or RESCHEDULE", code: "VALIDATION_FAILED" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body", code: "VALIDATION_FAILED" }, { status: 400 });
    }
    console.error("Failed to update booking:", error);
    return NextResponse.json({ error: "Failed to update booking", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
