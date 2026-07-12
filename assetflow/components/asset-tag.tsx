interface AssetTagProps {
  tag: string;
  className?: string;
}

export function AssetTag({ tag, className = "" }: AssetTagProps) {
  return (
    <span className={`font-mono text-xs text-signal bg-signal/10 px-1.5 py-0.5 rounded ${className}`}>
      {tag}
    </span>
  );
}
