import { plainDescription } from "../../../hooks/usePageDescription";
import type { HeroMapStat } from "../../../types/api";
import { formatPercent } from "../../../utils/format";

export type HeroSection = "perks" | "counters" | "maps";

interface SectionCopy {
  label: string;
  heading: (name: string) => string;
  title: (name: string) => string;
  description: (name: string) => string;
}

export const HERO_SECTIONS: HeroSection[] = ["perks", "counters", "maps"];

export const SECTION_COPY: Record<HeroSection, SectionCopy> = {
  perks: {
    label: "Perks",
    heading: (name) => `${name} perks`,
    title: (name) => `${name} perks: recommended Minor and Major perks`,
    description: (name) =>
      `All ${name} perks in Overwatch 2: Minor and Major perks, which ones are recommended and what each one does.`,
  },
  counters: {
    label: "Counters",
    heading: (name) => `${name} counters and synergies`,
    title: (name) => `${name} counters and synergies`,
    description: (name) =>
      `Who counters ${name} in Overwatch 2, who ${name} counters and which heroes work well with ${name}. Curated recommendations.`,
  },
  maps: {
    label: "Maps",
    heading: (name) => `Best maps for ${name}`,
    title: (name) => `Best maps for ${name}: win rate by map`,
    description: (name) =>
      `${name} win rate and pick rate on every Overwatch 2 map, with the best and worst maps.`,
  },
};

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
