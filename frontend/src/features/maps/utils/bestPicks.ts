import type { HeroRole, HeroStat } from "../../../types/api";

export interface RolePicks {
  role: HeroRole;
  gainers: HeroStat[];
  strongest: HeroStat[];
  droppers: HeroStat[];
  weakest: HeroStat[];
}

const ROLE_ORDER: HeroRole[] = ["TANK", "DAMAGE", "SUPPORT"];
const LIST_SIZE = 3;
const NEUTRAL_WIN_RATE = 50;
const WIN_RATE_SHRINKAGE = 4;
const GAIN_SHRINKAGE = 3;

function weight(hero: HeroStat, shrinkage: number): number {
  return hero.pickRate / (hero.pickRate + shrinkage);
}

export function adjustedWinRate(hero: HeroStat): number {
  return (
    NEUTRAL_WIN_RATE +
    (hero.winRate - NEUTRAL_WIN_RATE) * weight(hero, WIN_RATE_SHRINKAGE)
  );
}

export function weightedGain(hero: HeroStat): number | null {
  if (hero.winRateDelta === null) {
    return null;
  }
  return hero.winRateDelta * weight(hero, GAIN_SHRINKAGE);
}

interface Gain {
  hero: HeroStat;
  gain: number;
}

export function picksByRole(heroes: HeroStat[]): RolePicks[] {
  return ROLE_ORDER.flatMap((role) => {
    const inRole = heroes.filter((hero) => hero.role === role);
    if (inRole.length === 0) {
      return [];
    }
    const changes = inRole.flatMap((hero): Gain[] => {
      const gain = weightedGain(hero);
      return gain === null ? [] : [{ hero, gain }];
    });
    const gainers = changes
      .filter((entry) => entry.gain > 0)
      .sort((first, second) => second.gain - first.gain)
      .slice(0, LIST_SIZE)
      .map((entry) => entry.hero);
    const droppers = changes
      .filter((entry) => entry.gain < 0)
      .sort((first, second) => first.gain - second.gain)
      .slice(0, LIST_SIZE)
      .map((entry) => entry.hero);
    const byWinRate = [...inRole].sort(
      (first, second) => adjustedWinRate(second) - adjustedWinRate(first),
    );
    const strongest = byWinRate.slice(0, LIST_SIZE);
    const weakest = byWinRate.slice(-LIST_SIZE).reverse();
    return [{ role, gainers, strongest, droppers, weakest }];
  });
}
