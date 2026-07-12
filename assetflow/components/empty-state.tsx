import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, heading, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon size={40} className="text-ink3 mb-4" />
      <h3 className="text-sm font-semibold text-ink mb-1">{heading}</h3>
      {description && <p className="text-xs text-ink3 max-w-xs mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
