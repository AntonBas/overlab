import { useState } from "react";

interface ThumbnailProps {
  url: string | null;
  width: number;
  height: number;
  className?: string;
  eager?: boolean;
}

export function Thumbnail({
  url,
  width,
  height,
  className,
  eager = false,
}: ThumbnailProps) {
  const [failed, setFailed] = useState(false);

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
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
