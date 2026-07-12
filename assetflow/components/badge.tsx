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
  success: "border-green-500/60 bg-green-500/10 text-green-400",
  danger: "border-red-500/60 bg-red-500/10 text-red-400",
  warning: "border-amber-500/60 bg-amber-500/10 text-amber-400",
  neutral: "border-gray-600 bg-gray-500/10 text-gray-400",
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
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.12em]",
        badgeStyles[config.tone],
        className,
      )}
    >
      {config.label}
    </span>
  );
}
