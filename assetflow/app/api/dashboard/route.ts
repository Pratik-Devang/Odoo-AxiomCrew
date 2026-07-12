import { NextResponse } from "next/server";
import { addDays, format, isBefore } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const now = new Date();
  const nextWeek = addDays(now, 7);

  const [
    assetsAvailable,
    assetsAllocated,
    bookableFree,
    activeBookings,
    pendingTransfers,
    upcomingReturns,
    overdueReturns,
    allocations,
    bookings,
    maintenanceRequests,
  ] = await Promise.all([
    prisma.asset.count({ where: { status: "AVAILABLE" } }),
    prisma.asset.count({ where: { status: "ALLOCATED" } }),
    prisma.asset.count({
      where: {
        isBookable: true,
        bookings: {
          none: {
            status: "ONGOING",
          },
        },
      },
    }),
    prisma.booking.count({ where: { status: { in: ["UPCOMING", "ONGOING"] } } }),
    prisma.transferRequest.count({ where: { status: "REQUESTED" } }),
    prisma.allocation.count({
      where: {
        status: "ACTIVE",
        expectedReturnDate: {
          gte: now,
          lte: nextWeek,
        },
      },
    }),
    prisma.allocation.count({
      where: {
        status: "ACTIVE",
        expectedReturnDate: {
          lt: now,
        },
      },
    }),
    prisma.allocation.findMany({
      take: 10,
      orderBy: { allocatedAt: "desc" },
      include: {
        asset: { select: { name: true, tag: true } },
        employee: { select: { name: true, department: { select: { name: true } } } },
        department: { select: { name: true } },
      },
    }),
    prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        asset: { select: { name: true, tag: true } },
        bookedBy: { select: { name: true } },
      },
    }),
    prisma.maintenanceRequest.findMany({
      take: 10,
      orderBy: { raisedAt: "desc" },
      include: {
        asset: { select: { name: true, tag: true } },
        raisedBy: { select: { name: true } },
      },
    }),
  ]);

  const activity = [
    ...allocations.map((allocation) => {
      const holder = allocation.employee?.name ?? allocation.department?.name ?? "Unassigned";
      const dept = allocation.employee?.department?.name ?? allocation.department?.name;

      return {
        id: `allocation-${allocation.id}`,
        timestamp: allocation.allocatedAt.toISOString(),
        text: `${allocation.asset.name} ${allocation.asset.tag} - allocated to ${holder}${dept ? ` - ${dept} dept` : ""}`,
      };
    }),
    ...bookings.map((booking) => ({
      id: `booking-${booking.id}`,
      timestamp: booking.createdAt.toISOString(),
      text: `${booking.asset.name} ${booking.asset.tag} - booking ${booking.status.toLowerCase()} - ${format(
        booking.startTime,
        "h:mm a"
      )} to ${format(booking.endTime, "h:mm a")}`,
    })),
    ...maintenanceRequests.map((request) => ({
      id: `maintenance-${request.id}`,
      timestamp: request.raisedAt.toISOString(),
      text: `${request.asset.name} ${request.asset.tag} - maintenance ${request.status.toLowerCase().replaceAll("_", " ")} - raised by ${
        request.raisedBy.name
      }`,
    })),
  ]
    .sort((a, b) => (isBefore(new Date(a.timestamp), new Date(b.timestamp)) ? 1 : -1))
    .slice(0, 10);

  return NextResponse.json({
    kpis: {
      assetsAvailable,
      assetsAllocated,
      bookableFree,
      activeBookings,
      pendingTransfers,
      upcomingReturns,
    },
    overdueReturns,
    recentActivity: activity,
  });
}
