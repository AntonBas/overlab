import { useEffect, useRef } from "react";

interface ScrollSentinelProps {
  onReach: () => void;
  resetKey: number;
}

const LOOKAHEAD = "400px";

export function ScrollSentinel({ onReach, resetKey }: ScrollSentinelProps) {
  const element = useRef<HTMLDivElement>(null);
  const callback = useRef(onReach);

  useEffect(() => {
    callback.current = onReach;
  }, [onReach]);

  useEffect(() => {
    const target = element.current;
    if (!target || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          callback.current();
        }
      },
      { rootMargin: `0px 0px ${LOOKAHEAD} 0px` },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [resetKey]);

  return <div ref={element} aria-hidden="true" />;
}
