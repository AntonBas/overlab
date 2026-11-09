import { useFetch } from "../../../hooks/useFetch";
import type { GameQueue, Platform, RankTier, Region } from "../../../types/api";
import { fetchFreshness } from "../api/statsApi";
import { describeFreshness } from "../utils/freshness";

interface DataFreshnessProps {
  queue: GameQueue;
  tier: RankTier;
  platform: Platform;
  region: Region;
}

export function DataFreshness({
  queue,
  tier,
  platform,
  region,
}: DataFreshnessProps) {
  const freshness = useFetch(
    () => fetchFreshness(queue, tier, platform, region),
    [queue, tier, platform, region],
    { keepPrevious: true },
  );
  const text = freshness.data ? describeFreshness(freshness.data) : null;
  return text ? <span className="freshness">{text}</span> : null;
}
