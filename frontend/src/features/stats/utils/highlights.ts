import type { HeroHighlight } from "../../../components/ui/HeroHighlights";
import type { HeroStat } from "../../../types/stats";
import { formatPercent } from "../../../utils/format";

export const MIN_PICK_RATE_FOR_LEADER = 1;

function highlightOf(
  hero: HeroStat,
  key: string,
  label: string,
  value: number,
  tone: HeroHighlight["tone"],
): HeroHighlight {
  return {
    key,
    label,
    heroSlug: hero.heroSlug,
    heroName: hero.heroName,
    role: hero.role,
    portraitUrl: hero.portraitUrl,
    value: formatPercent(value),
    tone,
  };
}

function leaderBy(
  heroes: HeroStat[],
  rateOf: (hero: HeroStat) => number | null,
): HeroStat | undefined {
  return heroes.reduce<HeroStat | undefined>((leader, hero) => {
    const rate = rateOf(hero);
    if (rate === null) {
      return leader;
    }
    const leaderRate = leader ? rateOf(leader) : null;
    return leaderRate === null || rate > leaderRate ? hero : leader;
  }, undefined);
}

export function statsHighlights(
  heroes: HeroStat[],
  showBan: boolean,
): HeroHighlight[] {
  const items: HeroHighlight[] = [];
  const established = heroes.filter(
    (hero) => hero.pickRate >= MIN_PICK_RATE_FOR_LEADER,
  );
  const topWin = leaderBy(established, (hero) => hero.winRate);
  if (topWin) {
    items.push(
      highlightOf(topWin, "win", "Highest win rate", topWin.winRate, "win"),
    );
  }
  const topPick = leaderBy(heroes, (hero) => hero.pickRate);
  if (topPick) {
    items.push(
      highlightOf(topPick, "pick", "Most picked", topPick.pickRate, "pick"),
    );
  }
  const topBan = showBan ? leaderBy(heroes, (hero) => hero.banRate) : undefined;
  if (topBan && topBan.banRate !== null) {
    items.push(
      highlightOf(topBan, "ban", "Most banned", topBan.banRate, "ban"),
    );
  }
  return items;
}
