import { requireRole } from "@/lib/require-role";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { BookingService } from "@/lib/services/booking-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get("assetId");
  const date = searchParams.get("date");
  const myBookings = searchParams.get("myBookings");

  try {
    if (myBookings === "true") {
      const result = await BookingService.getMyBookings(auth.user.id);
      if ("error" in result) {
        return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
      }
      return NextResponse.json(result);
    }

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (startDate && endDate) {
      const result = await BookingService.getAllBookings(startDate, endDate);
      if ("error" in result) {
        return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
      }
      return NextResponse.json(result);
    }

    if (!assetId || !date) {
      return NextResponse.json(
        { error: "assetId and date are required, or startDate and endDate.", code: "VALIDATION_FAILED" },
        { status: 400 }
      );
    }

    const result = await BookingService.getBookingsForAsset(Number(assetId), date);
    if ("error" in result) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Retrieve bookings endpoint failed:", error);
    return NextResponse.json({ error: "Failed to fetch bookings.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { assetId, startTime, endTime } = body;

    if (!assetId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "assetId, startTime, and endTime are required.", code: "VALIDATION_FAILED" },
        { status: 400 }
      );
    }

    const result = await BookingService.createBooking(auth.user.id, {
      assetId: Number(assetId),
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

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body", code: "VALIDATION_FAILED" }, { status: 400 });
    }
    console.error("Booking creation failed:", error);
    return NextResponse.json({ error: "Failed to create booking", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
