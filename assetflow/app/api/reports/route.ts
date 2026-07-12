import { NextResponse } from "next/server";
import { differenceInCalendarDays, format, startOfMonth, subMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type CountMap = Map<number, number>;

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Access Denied: Employees cannot view analytics reports.", code: "FORBIDDEN" }, { status: 403 });
  }

  const isManager = user.role === "ADMIN" || user.role === "ASSET_MANAGER";
  const deptId = user.departmentId;

  if (user.role === "DEPARTMENT_HEAD" && deptId === null) {
    return NextResponse.json({
      departmentUsage: [],
      maintenanceFrequency: [],
      mostUsedAssets: [],
      idleAssets: [],
      maintenanceDue: [],
    });
  }

  const now = new Date();
  const retirementCutoff = subMonths(now, 48);
  const maintenanceCutoff = subMonths(now, 6);
  const months = Array.from({ length: 6 }, (_, index) => startOfMonth(subMonths(now, 5 - index)));

  const [
    departments,
    allocations,
    bookings,
    maintenanceRequests,
    assets,
    maintenanceResolved,
  ] = await Promise.all([
    prisma.department.findMany({
      where: isManager ? {} : { id: deptId! },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    }),
    prisma.allocation.findMany({
      where: isManager ? {} : { OR: [{ departmentId: deptId! }, { employee: { departmentId: deptId! } }] },
      include: {
        asset: { select: { id: true, tag: true, name: true } },
        employee: { select: { departmentId: true, department: { select: { name: true } } } },
        department: { select: { id: true, name: true } },
      },
    }),
    prisma.booking.findMany({
      where: isManager ? {} : { bookedBy: { departmentId: deptId! } },
      include: {
        asset: { select: { id: true, tag: true, name: true } },
        bookedBy: { select: { departmentId: true, department: { select: { name: true } } } },
      },
    }),
    prisma.maintenanceRequest.findMany({
      where: isManager ? {} : { asset: { OR: [{ currentHolderDepartmentId: deptId! }, { currentHolder: { departmentId: deptId! } }] } },
      include: {
        asset: { select: { id: true, tag: true, name: true } },
      },
    }),
    prisma.asset.findMany({
      where: isManager ? {} : { OR: [{ currentHolderDepartmentId: deptId! }, { currentHolder: { departmentId: deptId! } }] },
      include: {
        allocations: { orderBy: { allocatedAt: "desc" }, take: 1 },
        bookings: { orderBy: { createdAt: "desc" }, take: 1 },
        maintenanceRequests: { orderBy: { resolvedAt: "desc" }, where: { status: "RESOLVED" }, take: 1 },
      },
      orderBy: { tag: "asc" },
    }),
    prisma.maintenanceRequest.findMany({
      where: {
        status: "RESOLVED",
        resolvedAt: { not: null },
        ...(isManager ? {} : { asset: { OR: [{ currentHolderDepartmentId: deptId! }, { currentHolder: { departmentId: deptId! } }] } }),
      },
      select: { assetId: true, resolvedAt: true },
      orderBy: { resolvedAt: "desc" },
    }),
  ]);

  const departmentUsage = new Map<string, number>();
  departments.forEach((department) => departmentUsage.set(department.name, 0));

  allocations.forEach((allocation) => {
    const name = allocation.department?.name ?? allocation.employee?.department?.name ?? "Unassigned";
    departmentUsage.set(name, (departmentUsage.get(name) ?? 0) + 1);
  });

  bookings.forEach((booking) => {
    const name = booking.bookedBy.department?.name ?? "Unassigned";
    departmentUsage.set(name, (departmentUsage.get(name) ?? 0) + 1);
  });

  const maintenanceByMonth = months.map((month) => ({
    name: format(month, "MMM"),
    count: maintenanceRequests.filter((request) => startOfMonth(request.raisedAt).getTime() === month.getTime()).length,
  }));

  const bookingCounts: CountMap = new Map();
  const allocationCounts: CountMap = new Map();
  bookings.forEach((booking) => bookingCounts.set(booking.assetId, (bookingCounts.get(booking.assetId) ?? 0) + 1));
  allocations.forEach((allocation) =>
    allocationCounts.set(allocation.assetId, (allocationCounts.get(allocation.assetId) ?? 0) + 1)
  );

  const mostUsedAssets = assets
    .map((asset) => {
      const bookingCount = bookingCounts.get(asset.id) ?? 0;
      const allocationCount = allocationCounts.get(asset.id) ?? 0;

      return {
        id: asset.id,
        label: `${asset.name}: ${bookingCount} bookings, ${allocationCount} allocations`,
        score: bookingCount + allocationCount,
      };
    })
    .filter((asset) => asset.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const idleAssets = assets
    .filter((asset) => asset.status === "AVAILABLE")
    .map((asset) => {
      const latestAllocation = asset.allocations[0]?.allocatedAt;
      const latestBooking = asset.bookings[0]?.createdAt;
      const latestActivity = [latestAllocation, latestBooking, asset.createdAt]
        .filter(Boolean)
        .sort((a, b) => b!.getTime() - a!.getTime())[0]!;

      return {
        id: asset.id,
        label: `${asset.name} ${asset.tag}`,
        unusedDays: differenceInCalendarDays(now, latestActivity),
      };
    })
    .filter((asset) => asset.unusedDays >= 30)
    .sort((a, b) => b.unusedDays - a.unusedDays)
    .slice(0, 5);

  const latestResolvedMaintenance = new Map<number, Date>();
  maintenanceResolved.forEach((request) => {
    if (request.resolvedAt && !latestResolvedMaintenance.has(request.assetId)) {
      latestResolvedMaintenance.set(request.assetId, request.resolvedAt);
    }
  });

  const maintenanceDue = assets
    .map((asset) => {
      const reasons: string[] = [];
      const lastResolved = latestResolvedMaintenance.get(asset.id);

      // Hackathon heuristic: assets older than four years are considered nearing retirement.
      if (asset.acquisitionDate < retirementCutoff) {
        reasons.push("nearing retirement");
      }

      // Hackathon heuristic: no resolved maintenance in six months means due for a service check.
      if (!lastResolved || lastResolved < maintenanceCutoff) {
        reasons.push("maintenance check due");
      }

      return {
        id: asset.id,
        label: `${asset.name} ${asset.tag}`,
        reasons,
      };
    })
    .filter((asset) => asset.reasons.length > 0)
    .slice(0, 8);

  return NextResponse.json({
    departmentUsage: Array.from(departmentUsage.entries()).map(([name, count]) => ({ name, count })),
    maintenanceFrequency: maintenanceByMonth,
    mostUsedAssets,
    idleAssets,
    maintenanceDue,
  });
}
