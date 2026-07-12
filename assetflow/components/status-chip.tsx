import clsx from "clsx";

type AssetStatus =
  | "AVAILABLE"
  | "ALLOCATED"
  | "RESERVED"
  | "UNDER_MAINTENANCE"
  | "LOST"
  | "RETIRED"
  | "DISPOSED";

const statusConfig: Record<
  AssetStatus,
  { label: string; bg: string; text: string; dot?: boolean }
> = {
  AVAILABLE:         { label: "Available",          bg: "bg-go_bg",     text: "text-go",     dot: true },
  ALLOCATED:         { label: "Allocated",          bg: "bg-signal/10", text: "text-signal",  dot: false },
  RESERVED:          { label: "Reserved",           bg: "bg-warn_bg",   text: "text-warn",    dot: true },
  UNDER_MAINTENANCE: { label: "Under Maintenance",  bg: "bg-violet_bg", text: "text-violet",  dot: true },
  LOST:              { label: "Lost",               bg: "bg-danger_bg", text: "text-danger",  dot: true },
  RETIRED:           { label: "Retired",            bg: "bg-gray_bg",   text: "text-ink2",    dot: false },
  DISPOSED:          { label: "Disposed",           bg: "bg-gray_bg",   text: "text-ink3",    dot: false },
};

// Booking status
type BookingStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
const bookingConfig: Record<BookingStatus, { label: string; bg: string; text: string }> = {
  UPCOMING:  { label: "Upcoming",  bg: "bg-signal/10", text: "text-signal" },
  ONGOING:   { label: "Ongoing",   bg: "bg-go_bg",     text: "text-go" },
  COMPLETED: { label: "Completed", bg: "bg-gray_bg",   text: "text-ink3" },
  CANCELLED: { label: "Cancelled", bg: "bg-danger_bg", text: "text-danger" },
};

// Maintenance status
type MaintenanceStatus = "PENDING" | "APPROVED" | "REJECTED" | "TECHNICIAN_ASSIGNED" | "IN_PROGRESS" | "RESOLVED";
const maintenanceConfig: Record<MaintenanceStatus, { label: string; bg: string; text: string }> = {
  PENDING:            { label: "Pending",            bg: "bg-warn_bg",   text: "text-warn" },
  APPROVED:           { label: "Approved",           bg: "bg-signal/10", text: "text-signal" },
  REJECTED:           { label: "Rejected",           bg: "bg-danger_bg", text: "text-danger" },
  TECHNICIAN_ASSIGNED:{ label: "Assigned",           bg: "bg-violet_bg", text: "text-violet" },
  IN_PROGRESS:        { label: "In Progress",        bg: "bg-signal/10", text: "text-signal" },
  RESOLVED:           { label: "Resolved",           bg: "bg-go_bg",     text: "text-go" },
};

// Audit verification status
type AuditVerification = "PENDING" | "VERIFIED" | "MISSING" | "DAMAGED";
const auditConfig: Record<AuditVerification, { label: string; bg: string; text: string }> = {
  PENDING:  { label: "Pending",  bg: "bg-warn_bg",   text: "text-warn" },
  VERIFIED: { label: "Verified", bg: "bg-go_bg",     text: "text-go" },
  MISSING:  { label: "Missing",  bg: "bg-danger_bg", text: "text-danger" },
  DAMAGED:  { label: "Damaged",  bg: "bg-violet_bg", text: "text-violet" },
};

interface StatusChipProps {
  status: AssetStatus | BookingStatus | MaintenanceStatus | AuditVerification | string;
  size?: "sm" | "md";
}

export function StatusChip({ status, size = "md" }: StatusChipProps) {
  const allConfigs = { ...statusConfig, ...bookingConfig, ...maintenanceConfig, ...auditConfig } as Record<
    string,
    { label: string; bg: string; text: string; dot?: boolean }
  >;

  const cfg = allConfigs[status] ?? { label: status, bg: "bg-gray_bg", text: "text-ink2", dot: false };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        cfg.bg,
        cfg.text,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"
      )}
    >
      {cfg.dot && <span className={clsx("h-1.5 w-1.5 rounded-full", cfg.text.replace("text-", "bg-"))} />}
      {cfg.label}
    </span>
  );
}
