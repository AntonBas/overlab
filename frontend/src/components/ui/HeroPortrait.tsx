import { useState } from "react";

interface HeroPortraitProps {
  name: string;
  url: string | null;
  size?: number;
}

export function HeroPortrait({ name, url, size = 28 }: HeroPortraitProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const failed = failedUrl === url;
  const dimensions = { width: size, height: size };

  if (!url || failed) {
    return (
      <span
        className="portrait portrait--fallback"
        style={{ ...dimensions, fontSize: size * 0.45 }}
        aria-hidden="true"
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      className="portrait"
      src={url}
      alt=""
      {...dimensions}
      loading="lazy"
      decoding="async"
      data-loaded={loadedUrl === url ? "" : undefined}
      onLoad={() => setLoadedUrl(url)}
      onError={() => setFailedUrl(url)}
    />
  );
}
