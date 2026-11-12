import { api } from "../../../services/api";
import type {
  GameQueue,
  Platform,
  RankTier,
  Region,
} from "../../../types/common";
import type {
  DataFreshness,
  HeroHistory,
  HeroMapStats,
  HistoryStart,
  StatsComparison,
  StatsSnapshot,
} from "../../../types/stats";
import type { CoverageEntry, StatsFilters } from "../filters";

export async function fetchFreshness(
  queue: GameQueue,
  tier: RankTier,
  platform: Platform,
  region: Region,
): Promise<DataFreshness> {
  const { data } = await api.get<DataFreshness>("/stats/freshness", {
    params: { queue, tier, platform, region },
  });
  return data;
}

export async function fetchCoverage(): Promise<CoverageEntry[]> {
  const { data } = await api.get<CoverageEntry[]>("/stats/coverage");
  return data;
}

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

export interface HistoryParams extends HeroStatsParams {
  map?: string;
  from: string;
  to: string;
}

export async function fetchHeroHistory(
  slug: string,
  params: HistoryParams,
): Promise<HeroHistory> {
  const { data } = await api.get<HeroHistory>(`/stats/hero/${slug}/history`, {
    params,
  });
  return data;
}

export interface ComparisonParams extends HeroStatsParams {
  map?: string;
  patch?: string;
  from?: string;
  to?: string;
}

export async function fetchComparison(
  params: ComparisonParams,
): Promise<StatsComparison> {
  const { data } = await api.get<StatsComparison>("/stats/compare", {
    params,
  });
  return data;
}

export async function fetchHistoryStart(
  queue: GameQueue,
  tier: RankTier,
  platform: Platform,
  region: Region,
): Promise<HistoryStart> {
  const { data } = await api.get<HistoryStart>("/stats/history-start", {
    params: { queue, tier, platform, region },
  });
  return data;
}
