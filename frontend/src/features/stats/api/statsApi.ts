import { api } from "../../../services/api";
import type {
  GameQueue,
  HeroMapStats,
  Platform,
  RankTier,
  Region,
  StatsSnapshot,
} from "../../../types/api";
import type { StatsFilters } from "../filters";

export async function fetchStats(
  filters: StatsFilters,
): Promise<StatsSnapshot> {
  const { data } = await api.get<StatsSnapshot>("/stats", {
    params: {
      queue: filters.queue,
      tier: filters.tier,
      map: filters.map,
      platform: filters.platform,
      region: filters.region,
      role: filters.role ?? undefined,
      sort: filters.sort,
      direction: filters.direction,
    },
  });
  return data;
}

export interface HeroStatsParams {
  queue: GameQueue;
  tier: RankTier;
  platform: Platform;
  region: Region;
}

export async function fetchHeroMapStats(
  slug: string,
  params: HeroStatsParams,
): Promise<HeroMapStats> {
  const { data } = await api.get<HeroMapStats>(`/stats/hero/${slug}`, {
    params,
  });
  return data;
}
