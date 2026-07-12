import { prisma } from "@/lib/prisma";
import { MaintenanceStatus } from "@prisma/client";

export class MaintenanceService {
  static calculateEventLayout(start: Date, end: Date) {
    const startHour = start.getHours();
    const startMin = start.getMinutes();
    const endHour = end.getHours();
    const endMin = end.getMinutes();

    const businessStart = 8 * 60; // 08:00 = 480
    const businessEnd = 18 * 60;  // 18:00 = 1080

    const rawStart = startHour * 60 + startMin;
    const rawEnd = endHour * 60 + endMin;

    // Clamp to business hours
    const clampedStart = Math.max(businessStart, Math.min(businessEnd, rawStart));
    const clampedEnd = Math.max(businessStart, Math.min(businessEnd, rawEnd));

    const durationMinutes = Math.max(0, clampedEnd - clampedStart);
    const topPercent = ((clampedStart - businessStart) / (businessEnd - businessStart)) * 100;
    const heightPercent = (durationMinutes / (businessEnd - businessStart)) * 100;

    return {
      topPercent,
      heightPercent,
      durationMinutes,
    };
  }

  static async getCalendarEvents(startDate: Date, endDate: Date, resourceId?: number) {
    const whereClause: any = {
      status: {
        in: [
          MaintenanceStatus.APPROVED,
          MaintenanceStatus.TECHNICIAN_ASSIGNED,
          MaintenanceStatus.IN_PROGRESS,
          MaintenanceStatus.RESOLVED,
        ],
      },
      raisedAt: { lt: endDate },
    };

    if (resourceId) {
      whereClause.assetId = resourceId;
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where: whereClause,
      include: {
        asset: { select: { id: true, tag: true, name: true } },
        raisedBy: { select: { name: true } },
      },
    });

    // Filter requests that overlap with the date range [startDate, endDate]
    const filteredRequests = requests.filter((r) => {
      const resolvedAt = r.resolvedAt ? new Date(r.resolvedAt) : new Date();
      return resolvedAt > startDate;
    });

    return filteredRequests.map((r) => {
      const start = new Date(r.raisedAt);
      const end = r.resolvedAt ? new Date(r.resolvedAt) : new Date(start.getTime() + 4 * 60 * 60 * 1000); // 4 hrs default if ongoing
      const layout = this.calculateEventLayout(start, end);

      return {
        id: `m-${r.id}`,
        type: "MAINTENANCE" as const,
        assetId: r.assetId,
        assetName: r.asset.name,
        assetTag: r.asset.tag,
        title: `Maintenance: ${r.asset.name}`,
        start: start.toISOString(),
        end: end.toISOString(),
        color: "amber",
        status: r.status,
        topPercent: layout.topPercent,
        heightPercent: layout.heightPercent,
        durationMinutes: layout.durationMinutes,
        metadata: {
          technicianName: r.technicianName || "Pending Assignment",
          issueDescription: r.issueDescription,
          raisedBy: r.raisedBy.name,
          priority: r.priority,
        },
      };
    });
  }
}
