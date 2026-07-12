import clsx from "clsx";

// Flat Design: solid-border chips, no rounded-full, no soft backgrounds

type AssetStatus = "AVAILABLE" | "ALLOCATED" | "RESERVED" | "UNDER_MAINTENANCE" | "LOST" | "RETIRED" | "DISPOSED";

const statusConfig: Record<AssetStatus, { label: string; border: string; bg: string; text: string }> = {
  AVAILABLE:         { label: "Available",         border: "border-go",      bg: "bg-go_bg",     text: "text-go" },
  ALLOCATED:         { label: "Allocated",         border: "border-signal",  bg: "bg-surface",   text: "text-signal" },
  RESERVED:          { label: "Reserved",          border: "border-warn",    bg: "bg-warn_bg",   text: "text-warn" },
  UNDER_MAINTENANCE: { label: "Under Maint.",      border: "border-violet",  bg: "bg-violet_bg", text: "text-violet" },
  LOST:              { label: "Lost",              border: "border-danger",  bg: "bg-danger_bg", text: "text-danger" },
  RETIRED:           { label: "Retired",           border: "border-ink3",    bg: "bg-canvas",    text: "text-ink3" },
  DISPOSED:          { label: "Disposed",          border: "border-ink3",    bg: "bg-canvas",    text: "text-ink3" },
};

type BookingStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
const bookingConfig: Record<BookingStatus, { label: string; border: string; bg: string; text: string }> = {
  UPCOMING:  { label: "Upcoming",  border: "border-signal", bg: "bg-surface",   text: "text-signal" },
  ONGOING:   { label: "Ongoing",   border: "border-go",     bg: "bg-go_bg",     text: "text-go" },
  COMPLETED: { label: "Completed", border: "border-ink3",   bg: "bg-canvas",    text: "text-ink3" },
  CANCELLED: { label: "Cancelled", border: "border-danger", bg: "bg-danger_bg", text: "text-danger" },
};

type MaintenanceStatus = "PENDING" | "APPROVED" | "REJECTED" | "TECHNICIAN_ASSIGNED" | "IN_PROGRESS" | "RESOLVED";
const maintenanceConfig: Record<MaintenanceStatus, { label: string; border: string; bg: string; text: string }> = {
  PENDING:             { label: "Pending",    border: "border-warn",   bg: "bg-warn_bg",   text: "text-warn" },
  APPROVED:            { label: "Approved",   border: "border-signal", bg: "bg-surface",   text: "text-signal" },
  REJECTED:            { label: "Rejected",   border: "border-danger", bg: "bg-danger_bg", text: "text-danger" },
  TECHNICIAN_ASSIGNED: { label: "Assigned",   border: "border-violet", bg: "bg-violet_bg", text: "text-violet" },
  IN_PROGRESS:         { label: "In Progress",border: "border-signal", bg: "bg-surface",   text: "text-signal" },
  RESOLVED:            { label: "Resolved",   border: "border-go",     bg: "bg-go_bg",     text: "text-go" },
};

type AuditVerification = "PENDING" | "VERIFIED" | "MISSING" | "DAMAGED";
const auditConfig: Record<AuditVerification, { label: string; border: string; bg: string; text: string }> = {
  PENDING:  { label: "Pending",  border: "border-warn",   bg: "bg-warn_bg",   text: "text-warn" },
  VERIFIED: { label: "Verified", border: "border-go",     bg: "bg-go_bg",     text: "text-go" },
  MISSING:  { label: "Missing",  border: "border-danger", bg: "bg-danger_bg", text: "text-danger" },
  DAMAGED:  { label: "Damaged",  border: "border-violet", bg: "bg-violet_bg", text: "text-violet" },
};

interface StatusChipProps {
  status: AssetStatus | BookingStatus | MaintenanceStatus | AuditVerification | string;
  size?: "sm" | "md";
}

export function StatusChip({ status, size = "md" }: StatusChipProps) {
  const allConfigs = { ...statusConfig, ...bookingConfig, ...maintenanceConfig, ...auditConfig } as Record<
    string,
    { label: string; border: string; bg: string; text: string }
  >;

  const cfg = allConfigs[status] ?? { label: status, border: "border-ink3", bg: "bg-canvas", text: "text-ink3" };

  return (
    <span
      className={clsx(
        // Flat: sharp corners, solid border, no rounded-full
        "inline-flex items-center font-bold border",
        cfg.border, cfg.bg, cfg.text,
        size === "sm"
          ? "px-1.5 py-px text-[9px] uppercase tracking-[0.1em]"
          : "px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]"
      )}
    >
      {cfg.label}
    </span>
  );
}
