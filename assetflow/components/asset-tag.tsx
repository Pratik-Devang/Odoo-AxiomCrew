interface AssetTagProps {
  tag: string;
  className?: string;
}

export function AssetTag({ tag, className = "" }: AssetTagProps) {
  return (
    <span className={`af-asset-id ${className}`}>
      {tag}
    </span>
  );
}
