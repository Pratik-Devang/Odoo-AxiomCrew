import { NextResponse } from "next/server";
import { addDays, format, isBefore, startOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const dayKey = (date: Date) => format(date, "yyyy-MM-dd");

function countsByDay(dates: Date[], days: Date[]) {
  const counts = new Map(days.map((day) => [dayKey(day), 0]));

  dates.forEach((date) => {
    const key = dayKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return days.map((day) => counts.get(dayKey(day)) ?? 0);
}

function stockTrend(current: number, positiveEvents: number[], negativeEvents: number[] = []) {
  const values = Array(positiveEvents.length).fill(0);
  let cursor = current;

  for (let index = positiveEvents.length - 1; index >= 0; index -= 1) {
    values[index] = Math.max(0, cursor);
    cursor = cursor - positiveEvents[index] + negativeEvents[index];
  }

  return values;
}

function activityTrend(current: number, activity: number[]) {
  const peak = Math.max(current, ...activity, 1);
  return activity.map((value, index) => {
    if (index === activity.length - 1) return current;
    return Math.max(0, Math.round((value / peak) * Math.max(current, peak)));
  });
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const now = new Date();
  const today = startOfDay(now);
  const nextWeek = addDays(now, 7);
  const weekStart = startOfDay(subDays(now, 6));
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const [
    totalAssets,
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
    transferRequests,
    activeDepartmentAllocations,
    weekAllocations,
    weekReturnedAllocations,
    weekBookings,
    weekTransfers,
    weekMaintenanceRequests,
    weekExpectedReturns,
    auditDueThisWeek,
    todaysBookings,
    oldestPendingMaintenance,
  ] = await Promise.all([
    prisma.asset.count(),
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
    prisma.transferRequest.findMany({
      take: 10,
      orderBy: { requestedAt: "desc" },
      include: {
        asset: { select: { name: true, tag: true } },
        fromEmployee: { select: { name: true } },
        toEmployee: { select: { name: true } },
      },
    }),
    prisma.allocation.findMany({
      where: { status: "ACTIVE" },
      select: {
        department: { select: { name: true } },
        employee: { select: { department: { select: { name: true } } } },
      },
    }),
    prisma.allocation.findMany({
      where: { allocatedAt: { gte: weekStart } },
      select: { allocatedAt: true },
    }),
    prisma.allocation.findMany({
      where: { returnedAt: { gte: weekStart } },
      select: { returnedAt: true },
    }),
    prisma.booking.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { createdAt: true },
    }),
    prisma.transferRequest.findMany({
      where: { requestedAt: { gte: weekStart } },
      select: { requestedAt: true },
    }),
    prisma.maintenanceRequest.findMany({
      where: { raisedAt: { gte: weekStart } },
      select: { raisedAt: true },
    }),
    prisma.allocation.findMany({
      where: {
        status: "ACTIVE",
        expectedReturnDate: {
          gte: weekStart,
          lte: nextWeek,
        },
      },
      select: { expectedReturnDate: true },
    }),
    prisma.auditItem.count({
      where: {
        verification: "PENDING",
        auditCycle: {
          status: "OPEN",
          endDate: {
            gte: today,
            lte: nextWeek,
          },
        },
      },
    }),
    prisma.booking.findMany({
      where: {
        startTime: {
          gte: today,
          lt: addDays(today, 1),
        },
        status: { in: ["UPCOMING", "ONGOING"] },
      },
      include: {
        asset: { select: { name: true } },
      },
    }),
    prisma.maintenanceRequest.findFirst({
      where: { status: { in: ["PENDING", "APPROVED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS"] } },
      orderBy: { raisedAt: "asc" },
      include: {
        asset: { select: { name: true } },
      },
    }),
  ]);

  const allocationSeries = countsByDay(weekAllocations.map((item) => item.allocatedAt), days);
  const returnSeries = countsByDay(
    weekReturnedAllocations.flatMap((item) => (item.returnedAt ? [item.returnedAt] : [])),
    days
  );
  const bookingSeries = countsByDay(weekBookings.map((item) => item.createdAt), days);
  const transferSeries = countsByDay(weekTransfers.map((item) => item.requestedAt), days);
  const maintenanceSeries = countsByDay(weekMaintenanceRequests.map((item) => item.raisedAt), days);
  const expectedReturnSeries = countsByDay(
    weekExpectedReturns.flatMap((item) => (item.expectedReturnDate ? [item.expectedReturnDate] : [])),
    days
  );
  const activitySeries = days.map((_, index) => allocationSeries[index] + bookingSeries[index]);

  const departmentCounts = new Map<string, number>();
  activeDepartmentAllocations.forEach((allocation) => {
    const name = allocation.department?.name ?? allocation.employee?.department?.name ?? "Unassigned";
    departmentCounts.set(name, (departmentCounts.get(name) ?? 0) + 1);
  });

  const departmentAllocation = Array.from(departmentCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const bookingCounts = new Map<string, number>();
  todaysBookings.forEach((booking) => {
    bookingCounts.set(booking.asset.name, (bookingCounts.get(booking.asset.name) ?? 0) + 1);
  });

  const topBooking = Array.from(bookingCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  const maintenanceAgeDays = oldestPendingMaintenance
    ? Math.max(0, Math.ceil((now.getTime() - oldestPendingMaintenance.raisedAt.getTime()) / 86_400_000))
    : 0;

  const activity = [
    ...allocations.map((allocation) => {
      const holder = allocation.employee?.name ?? allocation.department?.name ?? "Unassigned";
      const dept = allocation.employee?.department?.name ?? allocation.department?.name;

      return {
        id: `allocation-${allocation.id}`,
        type: "allocation",
        timestamp: allocation.allocatedAt.toISOString(),
        text: `${allocation.asset.name} ${allocation.asset.tag} - allocated to ${holder}${dept ? ` - ${dept} dept` : ""}`,
      };
    }),
    ...bookings.map((booking) => ({
      id: `booking-${booking.id}`,
      type: "booking",
      timestamp: booking.createdAt.toISOString(),
      text: `${booking.asset.name} ${booking.asset.tag} - booking ${booking.status.toLowerCase()} - ${format(
        booking.startTime,
        "h:mm a"
      )} to ${format(booking.endTime, "h:mm a")}`,
    })),
    ...maintenanceRequests.map((request) => ({
      id: `maintenance-${request.id}`,
      type: "maintenance",
      timestamp: request.raisedAt.toISOString(),
      text: `${request.asset.name} ${request.asset.tag} - maintenance ${request.status.toLowerCase().replaceAll("_", " ")} - raised by ${
        request.raisedBy.name
      }`,
    })),
    ...transferRequests.map((request) => ({
      id: `transfer-${request.id}`,
      type: "transfer",
      timestamp: request.requestedAt.toISOString(),
      text: `${request.asset.name} ${request.asset.tag} - transfer requested from ${request.fromEmployee.name} to ${request.toEmployee.name}`,
    })),
  ]
    .sort((a, b) => (isBefore(new Date(a.timestamp), new Date(b.timestamp)) ? 1 : -1))
    .slice(0, 10);

  // Lifecycle requests dashboard widgets metrics
  const pendingRequests = await prisma.lifecycleRequest.count({ where: { status: "PENDING" } });
  const approvedToday = await prisma.lifecycleRequest.count({ where: { status: "APPROVED", reviewedAt: { gte: today } } });
  const rejectedToday = await prisma.lifecycleRequest.count({ where: { status: "REJECTED", reviewedAt: { gte: today } } });

  const retiredCount = await prisma.lifecycleRequest.count({ where: { requestedStatus: "RETIRED" } });
  const lostCount = await prisma.lifecycleRequest.count({ where: { requestedStatus: "LOST" } });
  const disposedCount = await prisma.lifecycleRequest.count({ where: { requestedStatus: "DISPOSED" } });

  const myPendingRequests = await prisma.lifecycleRequest.count({ where: { status: "PENDING", requestedById: user.id } });
  const approvedRequests = await prisma.lifecycleRequest.count({ where: { status: "APPROVED", requestedById: user.id } });
  const rejectedRequests = await prisma.lifecycleRequest.count({ where: { status: "REJECTED", requestedById: user.id } });

  const departmentLifecycleRequests = user.departmentId
    ? await prisma.lifecycleRequest.count({ where: { requestedBy: { departmentId: user.departmentId } } })
    : 0;

  const pendingDepartmentRequests = user.departmentId
    ? await prisma.lifecycleRequest.count({ where: { status: "PENDING", requestedBy: { departmentId: user.departmentId } } })
    : 0;

  return NextResponse.json({
    kpis: {
      assetsAvailable,
      assetsAllocated,
      bookableFree,
      activeBookings,
      pendingTransfers,
      upcomingReturns,
    },
    summary: {
      totalAssets,
      utilizationPercent: totalAssets > 0 ? Math.round((assetsAllocated / totalAssets) * 100) : 0,
      departmentAllocation,
      activitySeries,
    },
    trends: {
      assetsAvailable: stockTrend(assetsAvailable, returnSeries, allocationSeries),
      assetsAllocated: stockTrend(assetsAllocated, allocationSeries, returnSeries),
      bookableFree: activityTrend(bookableFree, bookingSeries.map((value) => Math.max(0, value))),
      activeBookings: activityTrend(activeBookings, bookingSeries),
      pendingTransfers: stockTrend(pendingTransfers, transferSeries),
      upcomingReturns: activityTrend(upcomingReturns, expectedReturnSeries),
    },
    insights: {
      auditDueThisWeek,
      topBooking: topBooking ? { assetName: topBooking[0], count: topBooking[1] } : null,
      oldestMaintenance: oldestPendingMaintenance
        ? {
            assetName: oldestPendingMaintenance.asset.name,
            ageDays: maintenanceAgeDays,
          }
        : null,
    },
    overdueReturns,
    recentActivity: activity,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
    },
    lifecycleWidgets: {
      pendingRequests,
      approvedToday,
      rejectedToday,
      trends: {
        retired: retiredCount,
        lost: lostCount,
        disposed: disposedCount,
      },
      myPendingRequests,
      approvedRequests,
      rejectedRequests,
      departmentLifecycleRequests,
      pendingDepartmentRequests,
    },
  });
}
