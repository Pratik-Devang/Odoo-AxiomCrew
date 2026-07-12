interface SectionHeaderProps {
  title: string;
  className?: string;
}

export function SectionHeader({ title, className = "" }: SectionHeaderProps) {
  return (
    <h2 className={`mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink3 ${className}`}>
      {title}
    </h2>
  );
}
