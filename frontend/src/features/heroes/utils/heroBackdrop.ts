import type { CSSProperties } from "react";

const HERO_BACKDROPS: Record<string, string> = {
  dmon: "/images/backgrounds/dmon.avif",
};

export function heroBackdropStyle(slug: string): CSSProperties | undefined {
  const image = HERO_BACKDROPS[slug];
  if (!image) {
    return undefined;
  }
  return {
    backgroundImage: `linear-gradient(180deg, rgb(15 18 24 / 0.55), rgb(15 18 24 / 0.88)), url(${image})`,
  };
}
