import { useState } from "react";

interface ThumbnailProps {
  url: string | null;
  width: number;
  height: number;
  className?: string;
  eager?: boolean;
  priority?: boolean;
}

export function Thumbnail({
  url,
  width,
  height,
  className,
  eager = false,
  priority = false,
}: ThumbnailProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = failedUrl === url;

  if (!url || failed) {
    return null;
  }
  return (
    <img
      className={className ? `thumbnail ${className}` : "thumbnail"}
      src={url}
      alt=""
      width={width}
      height={height}
      loading={eager || priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      onError={() => setFailedUrl(url)}
    />
  );
}
