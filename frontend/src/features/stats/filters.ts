import type {
  GameQueue,
  Platform,
  RankTier,
  Region,
  SortDirection,
  StatsSort,
} from "../../types/common";
import type { HeroRole } from "../../types/hero";

export interface StatsFilters {
  queue: GameQueue;
  tier: RankTier;
  map: string;
  platform: Platform;
  region: Region;
  role: HeroRole | null;
  sort: StatsSort;
  direction: SortDirection;
}

export const ALL_MAPS = "all-maps";

export const DEFAULT_FILTERS: StatsFilters = {
  queue: "COMPETITIVE",
  tier: "ALL",
  map: ALL_MAPS,
  platform: "PC",
  region: "EUROPE",
  role: null,
  sort: "PICK_RATE",
  direction: "DESC",
};

export const QUEUES: readonly GameQueue[] = ["QUICK_PLAY", "COMPETITIVE"];
export const TIERS: readonly RankTier[] = [
  "ALL",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
];
export const PLATFORMS: readonly Platform[] = ["PC", "CONSOLE"];
export const REGIONS: readonly Region[] = ["EUROPE", "AMERICAS", "ASIA"];
export const ROLES: readonly HeroRole[] = ["TANK", "DAMAGE", "SUPPORT"];
export const SORTS: readonly StatsSort[] = [
  "PICK_RATE",
  "WIN_RATE",
  "BAN_RATE",
  "NAME",
];
export const DIRECTIONS: readonly SortDirection[] = ["ASC", "DESC"];

export interface CoverageEntry {
  queue: GameQueue;
  platform: Platform;
  region: Region;
  tiers: RankTier[];
  mapTiers: RankTier[];
}

export type Coverage = readonly CoverageEntry[] | null;

const FALLBACK_DETAILED: Pick<CoverageEntry, "tiers" | "mapTiers"> = {
  tiers: [...TIERS],
  mapTiers: [...TIERS],
};

const FALLBACK_OVERALL: Pick<CoverageEntry, "tiers" | "mapTiers"> = {
  tiers: ["ALL"],
  mapTiers: [],
};

function entryFor(
  coverage: Coverage,
  filters: Pick<StatsFilters, "queue" | "platform" | "region">,
): Pick<CoverageEntry, "tiers" | "mapTiers"> {
  if (coverage === null) {
    return filters.platform === "PC" && filters.region === "EUROPE"
      ? FALLBACK_DETAILED
      : FALLBACK_OVERALL;
  }
  return (
    coverage.find(
      (entry) =>
        entry.queue === filters.queue &&
        entry.platform === filters.platform &&
        entry.region === filters.region,
    ) ?? FALLBACK_OVERALL
  );
}

export function availableTiers(
  coverage: Coverage,
  filters: Pick<StatsFilters, "queue" | "platform" | "region" | "map">,
): readonly RankTier[] {
  const entry = entryFor(coverage, filters);
  const tiers = filters.map === ALL_MAPS ? entry.tiers : entry.mapTiers;
  return TIERS.filter((tier) => tiers.includes(tier));
}

export function hasMapCoverage(
  coverage: Coverage,
  filters: Pick<StatsFilters, "queue" | "platform" | "region">,
): boolean {
  return entryFor(coverage, filters).mapTiers.length > 0;
}

export function applyCoverage(
  filters: StatsFilters,
  coverage: Coverage,
): StatsFilters {
  const mapped = hasMapCoverage(coverage, filters)
    ? filters
    : { ...filters, map: ALL_MAPS };
  const tiers = availableTiers(coverage, mapped);
  if (tiers.includes(mapped.tier)) {
    return mapped;
  }
  return {
    ...mapped,
    tier: tiers.includes("ALL") ? "ALL" : (tiers[0] ?? "ALL"),
  };
}

function pick<T extends string>(
  raw: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  const match = allowed.find((value) => value === raw?.toUpperCase());
  return match ?? fallback;
}

export function parseFilters(
  params: URLSearchParams,
  defaultRegion: Region = DEFAULT_FILTERS.region,
): StatsFilters {
  const rawRole = params.get("role");
  const queue = pick(params.get("queue"), QUEUES, DEFAULT_FILTERS.queue);
  return {
    queue,
    tier:
      queue === "QUICK_PLAY"
        ? "ALL"
        : pick(params.get("tier"), TIERS, DEFAULT_FILTERS.tier),
    map: params.get("map") || DEFAULT_FILTERS.map,
    platform: pick(params.get("platform"), PLATFORMS, DEFAULT_FILTERS.platform),
    region: pick(params.get("region"), REGIONS, defaultRegion),
    role: rawRole ? pick(rawRole, ROLES, ROLES[0]) : null,
    sort: pick(params.get("sort"), SORTS, DEFAULT_FILTERS.sort),
    direction: pick(
      params.get("direction"),
      DIRECTIONS,
      DEFAULT_FILTERS.direction,
    ),
  };
}

export function toSearchParams(
  filters: StatsFilters,
  defaultRegion: Region = DEFAULT_FILTERS.region,
): URLSearchParams {
  const params = new URLSearchParams();
  const defaults = { ...DEFAULT_FILTERS, region: defaultRegion };
  (Object.keys(DEFAULT_FILTERS) as (keyof StatsFilters)[]).forEach((key) => {
    const value = filters[key];
    if (value !== null && value !== defaults[key]) {
      params.set(key, String(value).toLowerCase());
    }
  });
  return params;
}

export function isQuickPlay(filters: StatsFilters): boolean {
  return filters.queue === "QUICK_PLAY";
}
