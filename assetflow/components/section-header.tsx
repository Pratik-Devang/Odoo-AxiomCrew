interface SectionHeaderProps {
  title: string;
  className?: string;
}

export function SectionHeader({ title, className = "" }: SectionHeaderProps) {
  return (
    <h2 className={`text-xs font-semibold uppercase tracking-widest text-ink3 mb-4 ${className}`}>
      {title}
    </h2>
  );
}
