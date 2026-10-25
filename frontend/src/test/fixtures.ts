import type { HeroStat, StatsSnapshot } from "../types/api";

export function heroStat(overrides: Partial<HeroStat> = {}): HeroStat {
  return {
    heroSlug: "ana",
    heroName: "Ana",
    role: "SUPPORT",
    subrole: "tactician",
    winRate: 47.1,
    pickRate: 23.1,
    banRate: 11.9,
    winRateDelta: null,
    pickRateDelta: null,
    banRateDelta: null,
    ...overrides,
  };
}

export function snapshot(
  overrides: Partial<StatsSnapshot> = {},
): StatsSnapshot {
  return {
    capturedAt: "2026-10-25T04:00:00Z",
    queue: "COMPETITIVE",
    tier: "ALL",
    map: "all-maps",
    platform: "PC",
    region: "EUROPE",
    heroes: [
      heroStat(),
      heroStat({
        heroSlug: "genji",
        heroName: "Genji",
        role: "DAMAGE",
        winRate: 55.1,
        pickRate: 15.3,
        banRate: 10.3,
      }),
    ],
    ...overrides,
  };
}
