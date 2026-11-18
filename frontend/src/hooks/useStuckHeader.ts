import { useEffect, useState } from "react";

function headerOffset(): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue(
    "--header-height",
  );
  return Number.parseFloat(value) || 0;
}

export function useStuckHeader() {
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (!sentinel || typeof IntersectionObserver === "undefined") {
      return;
    }
    const offset = headerOffset();
    const observer = new IntersectionObserver(
      ([entry]) => {
        setStuck(
          !entry.isIntersecting && entry.boundingClientRect.top < offset,
        );
      },
      { rootMargin: `-${offset}px 0px 0px 0px` },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel]);

  return { sentinelRef: setSentinel, stuck };
}
