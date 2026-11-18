import { useFetch } from "../../../hooks/useFetch";
import type {
  GameQueue,
  Platform,
  RankTier,
  Region,
} from "../../../types/common";
import { fetchFreshness } from "../api/statsApi";
import { describeFreshness } from "../utils/freshness";

const PENDING_TEXT = "Blizzard last changed these numbers on 30 Sep 2026.";

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
  if (freshness.loading && !freshness.data) {
    return (
      <span className="freshness freshness--pending" aria-hidden="true">
        {PENDING_TEXT}
      </span>
    );
  }
  return text ? <span className="freshness">{text}</span> : null;
}
