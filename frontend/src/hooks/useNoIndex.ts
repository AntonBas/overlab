import { useEffect } from "react";

export function useNoIndex(active: boolean = true) {
  useEffect(() => {
    if (!active) {
      return;
    }
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [active]);
}
