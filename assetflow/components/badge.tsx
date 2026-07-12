import clsx from "clsx";

export type BadgeStatus =
  | "active"
  | "inactive"
  | "available"
  | "allocated"
  | "reserved"
  | "maintenance"
  | "lost"
  | "retired"
  | "disposed"
  | "verified"
  | "missing"
  | "damaged"
  | "pending"
  | "approved"
  | "rejected";

const badgeStyles = {
  success: "bg-go_bg text-go before:bg-go",
  danger: "bg-danger_bg text-danger before:bg-danger",
  warning: "bg-warn_bg text-warn before:bg-warn",
  neutral: "bg-gray_bg text-ink2 before:bg-ink2",
} as const;

const statusConfig: Record<BadgeStatus, { label: string; tone: keyof typeof badgeStyles }> = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
  available: { label: "Available", tone: "success" },
  allocated: { label: "Allocated", tone: "neutral" },
  reserved: { label: "Reserved", tone: "warning" },
  maintenance: { label: "Under Maintenance", tone: "warning" },
  lost: { label: "Lost", tone: "danger" },
  retired: { label: "Retired", tone: "neutral" },
  disposed: { label: "Disposed", tone: "neutral" },
  verified: { label: "Verified", tone: "success" },
  missing: { label: "Missing", tone: "danger" },
  damaged: { label: "Damaged", tone: "danger" },
  pending: { label: "Pending", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

export function Badge({ status, className }: { status: BadgeStatus; className?: string }) {
  const config = statusConfig[status];

  return (
    <span
      className={clsx(
        "af-status-chip",
        badgeStyles[config.tone],
        className,
      )}
    >
      {config.label}
    </span>
  );
}
