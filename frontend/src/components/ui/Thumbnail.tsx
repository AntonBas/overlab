import { useState, type ReactNode } from "react";

interface ThumbnailProps {
  url: string | null;
  width: number;
  height: number;
  className?: string;
  eager?: boolean;
  priority?: boolean;
  fallback?: ReactNode;
}

export function Thumbnail({
  url,
  width,
  height,
  className,
  eager = false,
  priority = false,
  fallback = null,
}: ThumbnailProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const failed = failedUrl === url;

  if (!url || failed) {
    return fallback;
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
      data-loaded={loadedUrl === url ? "" : undefined}
      onLoad={() => setLoadedUrl(url)}
      onError={() => setFailedUrl(url)}
    />
  );
}
