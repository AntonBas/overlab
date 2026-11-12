import type { GameQueue, Platform, RankTier, Region } from "./common";
import type { Hero, HeroRole } from "./hero";
import type { MapMode } from "./map";

export interface HeroStat {
  heroSlug: string;
  heroName: string;
  role: HeroRole;
  subrole: string | null;
  winRate: number;
  pickRate: number;
  banRate: number | null;
  winRateDelta: number | null;
  pickRateDelta: number | null;
  banRateDelta: number | null;
  portraitUrl: string | null;
  recentlyAdded?: boolean;
}

export interface HistoryStart {
  firstCapturedAt: string | null;
}

export interface DataFreshness {
  capturedAt: string;
  lastCheckedAt: string;
  valuesSince: string;
  snapshotCount: number;
  changeObserved: boolean;
}

export interface StatsSnapshot {
  capturedAt: string;
  queue: GameQueue;
  tier: RankTier;
  map: string;
  platform: Platform;
  region: Region;
  heroes: HeroStat[];
}

export interface HeroMapStat {
  mapSlug: string | null;
  mapName: string | null;
  mode: MapMode | null;
  winRate: number;
  pickRate: number;
  banRate: number | null;
  winRateDelta: number | null;
  pickRateDelta: number | null;
  capturedAt: string;
}

export interface HeroMapStats {
  hero: Hero;
  queue: GameQueue;
  tier: RankTier;
  platform: Platform;
  region: Region;
  overall: HeroMapStat | null;
  maps: HeroMapStat[];
}

export interface HeroHistoryPoint {
  capturedAt: string;
  winRate: number;
  pickRate: number;
  banRate: number | null;
}

export interface HeroHistory {
  hero: Hero;
  queue: GameQueue;
  tier: RankTier;
  map: string;
  platform: Platform;
  region: Region;
  from: string;
  to: string;
  points: HeroHistoryPoint[];
}

export interface HeroRoleChange {
  changedAt: string;
  previousRole: HeroRole;
  newRole: HeroRole;
}

export interface HeroChange {
  heroSlug: string;
  heroName: string;
  role: HeroRole;
  winRateBefore: number;
  winRateAfter: number;
  winRateChange: number;
  pickRateBefore: number;
  pickRateAfter: number;
  pickRateChange: number;
  banRateBefore: number | null;
  banRateAfter: number | null;
  banRateChange: number | null;
  roleChange: HeroRoleChange | null;
}

export interface StatsComparison {
  beforeCapturedAt: string;
  afterCapturedAt: string;
  queue: GameQueue;
  tier: RankTier;
  map: string;
  platform: Platform;
  region: Region;
  heroes: HeroChange[];
}
