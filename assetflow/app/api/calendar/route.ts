import { requireRole } from "@/lib/require-role";
import { UserRole, AssetStatus, BookingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { BookingService } from "@/lib/services/booking-service";
import { MaintenanceService } from "@/lib/services/maintenance-service";
import { prisma } from "@/lib/prisma";
import { startOfWeek, addDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireRole(Object.values(UserRole));
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const weekStartParam = searchParams.get("weekStart");
    const resourceIdParam = searchParams.get("resourceId");

    let weekStart = new Date();
    if (weekStartParam) {
      weekStart = new Date(weekStartParam);
    }
    // Align to Monday start
    const monday = startOfWeek(weekStart, { weekStartsOn: 1 });
    monday.setHours(0, 0, 0, 0);

    const sundayEnd = addDays(monday, 7);
    sundayEnd.setHours(23, 59, 59, 999);

    const resourceId = resourceIdParam ? Number(resourceIdParam) : undefined;

    // Fetch aggregated events
    const [bookings, maintenance] = await Promise.all([
      BookingService.getCalendarEvents(monday, sundayEnd, resourceId),
      MaintenanceService.getCalendarEvents(monday, sundayEnd, resourceId),
    ]);

    const events = [...bookings, ...maintenance];

    // Fetch resources for sidebar & row mappings
    const assets = await prisma.asset.findMany({
      where: {
        isBookable: true,
        status: {
          notIn: [AssetStatus.RETIRED, AssetStatus.DISPOSED, AssetStatus.LOST],
        },
      },
      select: {
        id: true,
        tag: true,
        name: true,
        status: true,
        location: true,
      },
      orderBy: { tag: "asc" },
    });

    // Compute dynamic count and state per resource
    const resources = assets.map((asset) => {
      // Find all bookings for this resource in the week
      const assetBookingsCount = bookings.filter((b) => b.assetId === asset.id).length;
      // Check if under maintenance currently
      const underMaintenance =
        asset.status === AssetStatus.UNDER_MAINTENANCE ||
        maintenance.some((m) => m.assetId === asset.id && m.status !== "RESOLVED");

      return {
        id: asset.id,
        tag: asset.tag,
        name: asset.name,
        status: asset.status,
        location: asset.location,
        bookingCount: assetBookingsCount,
        underMaintenance,
      };
    });

    return NextResponse.json({
      events,
      resources,
      weekStart: monday.toISOString(),
      weekEnd: sundayEnd.toISOString(),
    });
  } catch (err) {
    console.error("Failed to retrieve calendar resources/events:", err);
    return NextResponse.json(
      { error: "Failed to load calendar data.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
