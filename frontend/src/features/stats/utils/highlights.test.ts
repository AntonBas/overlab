import { describe, expect, it } from "vitest";
import type { HeroStat } from "../../../types/stats";
import { statsHighlights } from "./highlights";

function hero(overrides: Partial<HeroStat>): HeroStat {
  return {
    heroSlug: "ana",
    heroName: "Ana",
    role: "SUPPORT",
    subrole: null,
    winRate: 50,
    pickRate: 10,
    banRate: 5,
    winRateDelta: null,
    pickRateDelta: null,
    banRateDelta: null,
    portraitUrl: null,
    recentlyAdded: false,
    ...overrides,
  };
}

describe("statsHighlights", () => {
  const heroes = [
    hero({ heroSlug: "ana", heroName: "Ana", winRate: 51, pickRate: 20 }),
    hero({
      heroSlug: "rare",
      heroName: "Rare",
      winRate: 58,
      pickRate: 0.2,
      banRate: 40,
    }),
    hero({ heroSlug: "mei", heroName: "Mei", winRate: 49, pickRate: 8 }),
  ];

  it("ignores rarely picked heroes for the win rate leader", () => {
    const items = statsHighlights(heroes, true);

    expect(items.find((item) => item.key === "win")?.heroName).toBe("Ana");
  });

  it("names the most picked and the most banned hero", () => {
    const items = statsHighlights(heroes, true);

    expect(items.find((item) => item.key === "pick")?.heroName).toBe("Ana");
    expect(items.find((item) => item.key === "ban")?.heroName).toBe("Rare");
  });

  it("leaves out the ban card when bans are not tracked", () => {
    expect(
      statsHighlights(heroes, false).some((item) => item.key === "ban"),
    ).toBe(false);
  });

  it("returns nothing for an empty list", () => {
    expect(statsHighlights([], true)).toEqual([]);
  });
});
