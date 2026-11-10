import { plainDescription } from "../../../hooks/usePageDescription";
import type { HeroMapStat } from "../../../types/api";
import { formatPercent } from "../../../utils/format";

export function heroPageTitle(name: string): string {
  return `${name} stats, perks, counters and best maps`;
}

export function heroPageDescription(
  name: string,
  description: string | null | undefined,
): string {
  const lead = `${name} Overwatch 2 stats: win, pick and ban rates, perks, counters and best maps.`;
  return plainDescription(description ? `${lead} ${description}` : lead);
}

export function heroStatsSentence(
  name: string,
  overall: HeroMapStat | null,
  competitive: boolean,
): string | null {
  if (!overall) {
    return null;
  }
  const queue = competitive ? "Competitive" : "Quick Play";
  const ban = competitive && overall.banRate !== null;
  return (
    `In ${queue} (all ranks, PC, Europe) ${name} has a ${formatPercent(overall.winRate)} win rate, ` +
    `a ${formatPercent(overall.pickRate)} pick rate` +
    (ban ? ` and a ${formatPercent(overall.banRate)} ban rate.` : ".")
  );
}
