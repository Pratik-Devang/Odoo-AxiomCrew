import clsx from "clsx";

type AssetStatus = "AVAILABLE" | "ALLOCATED" | "RESERVED" | "UNDER_MAINTENANCE" | "LOST" | "RETIRED" | "DISPOSED";

const statusConfig: Record<AssetStatus, { label: string; tone: string }> = {
  AVAILABLE: { label: "Available", tone: "bg-go_bg text-go before:bg-go" },
  ALLOCATED: { label: "Allocated", tone: "bg-violet_bg text-signal before:bg-signal" },
  RESERVED: { label: "Reserved", tone: "bg-warn_bg text-warn before:bg-warn" },
  UNDER_MAINTENANCE: { label: "Under Maint.", tone: "bg-warn_bg text-warn before:bg-warn" },
  LOST: { label: "Lost", tone: "bg-danger_bg text-danger before:bg-danger" },
  RETIRED: { label: "Retired", tone: "bg-gray_bg text-ink2 before:bg-ink2" },
  DISPOSED: { label: "Disposed", tone: "bg-gray_bg text-ink2 before:bg-ink2" },
};

type BookingStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
const bookingConfig: Record<BookingStatus, { label: string; tone: string }> = {
  UPCOMING: { label: "Upcoming", tone: "bg-violet_bg text-signal before:bg-signal" },
  ONGOING: { label: "Ongoing", tone: "bg-go_bg text-go before:bg-go" },
  COMPLETED: { label: "Completed", tone: "bg-gray_bg text-ink2 before:bg-ink2" },
  CANCELLED: { label: "Cancelled", tone: "bg-danger_bg text-danger before:bg-danger" },
};

type MaintenanceStatus = "PENDING" | "APPROVED" | "REJECTED" | "TECHNICIAN_ASSIGNED" | "IN_PROGRESS" | "RESOLVED";
const maintenanceConfig: Record<MaintenanceStatus, { label: string; tone: string }> = {
  PENDING: { label: "Pending", tone: "bg-warn_bg text-warn before:bg-warn" },
  APPROVED: { label: "Approved", tone: "bg-violet_bg text-signal before:bg-signal" },
  REJECTED: { label: "Rejected", tone: "bg-danger_bg text-danger before:bg-danger" },
  TECHNICIAN_ASSIGNED: { label: "Assigned", tone: "bg-warn_bg text-warn before:bg-warn" },
  IN_PROGRESS: { label: "In Progress", tone: "bg-violet_bg text-signal before:bg-signal" },
  RESOLVED: { label: "Resolved", tone: "bg-go_bg text-go before:bg-go" },
};

type AuditVerification = "PENDING" | "VERIFIED" | "MISSING" | "DAMAGED";
const auditConfig: Record<AuditVerification, { label: string; tone: string }> = {
  PENDING: { label: "Pending", tone: "bg-warn_bg text-warn before:bg-warn" },
  VERIFIED: { label: "Verified", tone: "bg-go_bg text-go before:bg-go" },
  MISSING: { label: "Missing", tone: "bg-danger_bg text-danger before:bg-danger" },
  DAMAGED: { label: "Damaged", tone: "bg-danger_bg text-danger before:bg-danger" },
};

interface StatusChipProps {
  status: AssetStatus | BookingStatus | MaintenanceStatus | AuditVerification | string;
  size?: "sm" | "md";
}

export function StatusChip({ status, size = "md" }: StatusChipProps) {
  const allConfigs = { ...statusConfig, ...bookingConfig, ...maintenanceConfig, ...auditConfig } as Record<string, { label: string; tone: string }>;

  const cfg = allConfigs[status] ?? { label: status, tone: "bg-gray_bg text-ink2 before:bg-ink2" };

  return (
    <span
      className={clsx(
        "af-status-chip",
        cfg.tone,
        size === "sm"
          ? "px-1.5 py-px text-[10px]"
          : "px-2 py-1 text-[11px]"
      )}
    >
      {cfg.label}
    </span>
  );
}
