import { useEffect } from "react";

export function useNoIndex(enabled = true) {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [enabled]);
}
