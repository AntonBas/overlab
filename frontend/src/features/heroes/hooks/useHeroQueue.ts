import { useSearchParams } from "react-router-dom";
import type { GameQueue } from "../../../types/api";

export function useHeroQueue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queue: GameQueue =
    searchParams.get("queue")?.toUpperCase() === "QUICK_PLAY"
      ? "QUICK_PLAY"
      : "COMPETITIVE";
  const linkSuffix = queue === "QUICK_PLAY" ? "?queue=quick_play" : "";

  function changeQueue(next: GameQueue) {
    const params = new URLSearchParams(searchParams);
    if (next === "COMPETITIVE") {
      params.delete("queue");
    } else {
      params.set("queue", "quick_play");
    }
    setSearchParams(params);
  }

  return { queue, linkSuffix, changeQueue };
}
