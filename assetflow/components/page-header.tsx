import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
      <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  );
}
