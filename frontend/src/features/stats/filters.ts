import type {
  GameQueue,
  HeroRole,
  Platform,
  RankTier,
  Region,
  SortDirection,
  StatsSort,
} from "../../types/api";

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

function pick<T extends string>(
  raw: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  const match = allowed.find((value) => value === raw?.toUpperCase());
  return match ?? fallback;
}

export function parseFilters(params: URLSearchParams): StatsFilters {
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
    region: pick(params.get("region"), REGIONS, DEFAULT_FILTERS.region),
    role: rawRole ? pick(rawRole, ROLES, ROLES[0]) : null,
    sort: pick(params.get("sort"), SORTS, DEFAULT_FILTERS.sort),
    direction: pick(
      params.get("direction"),
      DIRECTIONS,
      DEFAULT_FILTERS.direction,
    ),
  };
}

export function toSearchParams(filters: StatsFilters): URLSearchParams {
  const params = new URLSearchParams();
  (Object.keys(DEFAULT_FILTERS) as (keyof StatsFilters)[]).forEach((key) => {
    const value = filters[key];
    if (value !== null && value !== DEFAULT_FILTERS[key]) {
      params.set(key, String(value).toLowerCase());
    }
  });
  return params;
}

export function isQuickPlay(filters: StatsFilters): boolean {
  return filters.queue === "QUICK_PLAY";
}
