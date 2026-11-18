import { useEffect, useState, type CSSProperties } from "react";
import { probeImage } from "./probeImage";

const availability = new Map<string, Promise<boolean>>();

export function heroBackdropUrl(slug: string): string {
  return `/images/backgrounds/${encodeURIComponent(slug)}.webp`;
}

export function checkHeroBackdrop(slug: string): Promise<boolean> {
  const known = availability.get(slug);
  if (known) {
    return known;
  }
  const check = probeImage(heroBackdropUrl(slug));
  availability.set(slug, check);
  return check;
}

export function resetHeroBackdropChecks(): void {
  availability.clear();
}

export function heroBackdropStyle(url: string): CSSProperties {
  return {
    backgroundImage: `linear-gradient(180deg, rgb(15 18 24 / 0.7), rgb(15 18 24 / 0.9)), url(${url})`,
  };
}

export function useHeroBackdrop(slug: string): string | undefined {
  const [available, setAvailable] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    checkHeroBackdrop(slug).then((exists) => {
      if (active) {
        setAvailable(exists ? slug : null);
      }
    });
    return () => {
      active = false;
    };
  }, [slug]);
  return available === slug ? heroBackdropUrl(slug) : undefined;
}
