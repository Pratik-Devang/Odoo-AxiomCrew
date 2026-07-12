import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-end justify-between border-b border-border pb-4">
      <h1 className="font-display text-[22px] font-semibold tracking-[-0.3px] text-ink">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  );
}
