interface AssetTagProps {
  tag: string;
  className?: string;
}

export function AssetTag({ tag, className = "" }: AssetTagProps) {
  return (
    <span className={`font-mono text-xs font-semibold text-signal border border-signal bg-surface px-1.5 py-px ${className}`}>
      {tag}
    </span>
  );
}
