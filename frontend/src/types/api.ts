export type HeroRole = "TANK" | "DAMAGE" | "SUPPORT";
export type GameQueue = "QUICK_PLAY" | "COMPETITIVE";
export type RankTier =
  | "ALL"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "EMERALD"
  | "DIAMOND"
  | "MASTER"
  | "GRANDMASTER";
export type Platform = "PC" | "CONSOLE";
export type Region = "EUROPE" | "AMERICAS" | "ASIA";
export type MapMode =
  "CONTROL" | "ESCORT" | "HYBRID" | "PUSH" | "FLASHPOINT" | "CLASH";
export type StatsSort = "PICK_RATE" | "WIN_RATE" | "BAN_RATE" | "NAME";
export type SortDirection = "ASC" | "DESC";

export interface Hero {
  slug: string;
  name: string;
  role: HeroRole;
  subrole: string | null;
  description: string | null;
  strengths: string | null;
  weaknesses: string | null;
  portraitUrl: string | null;
}

export interface Ability {
  heroSlug: string;
  slug: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
}

export interface Favorites {
  heroes: Hero[];
  maps: GameMap[];
}

export interface Note {
  heroSlug: string;
  heroName: string;
  content: string;
  updatedAt: string | null;
}

export interface Preferences {
  queue: GameQueue | null;
  platform: Platform | null;
  region: Region | null;
  tier: RankTier | null;
}

export interface GameMap {
  slug: string;
  name: string;
  mode: MapMode | null;
  imageUrl: string | null;
}

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

export type PerkSlot = "MINOR" | "MAJOR";
export type PerkPosition = "LEFT" | "RIGHT";
export type PerkRecommendation = "RECOMMENDED" | "OPTIONAL" | "AVOID";

export interface Perk {
  id: number;
  heroSlug: string;
  name: string;
  description: string | null;
  slot: PerkSlot;
  position: PerkPosition;
  recommendation: PerkRecommendation;
  recommendationNote: string | null;
  iconUrl: string | null;
}

export interface RelatedHero {
  slug: string;
  name: string;
  role: HeroRole;
  strength: number;
  note: string | null;
}

export interface HeroCounters {
  counters: RelatedHero[];
  counteredBy: RelatedHero[];
}

export interface Guide {
  id: number;
  slug: string;
  path: string;
  heroSlug: string;
  heroName: string;
  mapSlug: string | null;
  mapName: string | null;
  title: string;
  youtubeId: string;
  startSeconds: number;
  embedUrl: string;
  description: string | null;
  sortOrder: number;
  published: boolean;
}

export interface Patch {
  id: number;
  version: string;
  slug: string;
  title: string | null;
  releasedAt: string;
  notes: string | null;
}

export type UserRole = "USER" | "ADMIN";

export interface User {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
  provider: "LOCAL" | "GOOGLE";
  emailVerified: boolean;
}

export interface ApiErrorBody {
  status: string;
  statusCode: number;
  timestamp: string;
  message: string;
  path: string;
  subErrors: { field: string; message: string }[];
}
