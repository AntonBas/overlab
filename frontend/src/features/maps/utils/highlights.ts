import type { HeroStat } from "../../../types/api";

export interface MapHighlights {
  best: HeroStat[];
  worst: HeroStat[];
}

const HIGHLIGHT_COUNT = 3;
const MIN_PICK_RATE = 2;

export function mapHighlights(heroes: HeroStat[]): MapHighlights {
  const comparable = heroes.filter(
    (hero) => hero.winRateDelta !== null && hero.pickRate >= MIN_PICK_RATE,
  );
  const byDelta = [...comparable].sort(
    (first, second) => (second.winRateDelta ?? 0) - (first.winRateDelta ?? 0),
  );
  const best = byDelta
    .filter((hero) => (hero.winRateDelta ?? 0) > 0)
    .slice(0, HIGHLIGHT_COUNT);
  const worst = [...byDelta]
    .reverse()
    .filter((hero) => (hero.winRateDelta ?? 0) < 0)
    .slice(0, HIGHLIGHT_COUNT);
  return { best, worst };
}
