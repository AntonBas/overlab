import { describe, expect, it } from "vitest";
import type { HeroMapStat } from "../../../types/api";
import { mapPicks } from "./mapPicks";

function entry(overrides: Partial<HeroMapStat>): HeroMapStat {
  return {
    mapSlug: "busan",
    mapName: "Busan",
    mode: "CONTROL",
    winRate: 50,
    pickRate: 20,
    banRate: null,
    winRateDelta: 0,
    pickRateDelta: null,
    capturedAt: "2026-10-29T10:00:00Z",
    ...overrides,
  };
}

function slugs(entries: HeroMapStat[]): (string | null)[] {
  return entries.map((item) => item.mapSlug);
}

describe("mapPicks", () => {
  it("lists the maps where the hero gains most and where the win rate is highest", () => {
    const picks = mapPicks([
      entry({ mapSlug: "a", winRate: 56, winRateDelta: -1 }),
      entry({ mapSlug: "b", winRate: 46, winRateDelta: 3 }),
      entry({ mapSlug: "c", winRate: 50, winRateDelta: 0.5 }),
    ]);

    expect(slugs(picks.gainers)).toEqual(["b", "c"]);
    expect(picks.strongest[0].mapSlug).toBe("a");
  });

  it("lists the maps where the hero drops most and where the win rate is lowest", () => {
    const picks = mapPicks([
      entry({ mapSlug: "a", winRate: 44, winRateDelta: 1 }),
      entry({ mapSlug: "b", winRate: 52, winRateDelta: -4 }),
      entry({ mapSlug: "c", winRate: 55, winRateDelta: -1 }),
    ]);

    expect(slugs(picks.droppers)).toEqual(["b", "c"]);
    expect(picks.weakest[0].mapSlug).toBe("a");
  });

  it("ignores the overall row that has no map", () => {
    const picks = mapPicks([
      entry({ mapSlug: null, mapName: null, winRate: 99, winRateDelta: 9 }),
      entry({ mapSlug: "a" }),
    ]);

    expect(slugs(picks.strongest)).toEqual(["a"]);
  });

  it("shows at most five maps per list", () => {
    const maps = Array.from({ length: 8 }, (_, index) =>
      entry({ mapSlug: `m${index}`, winRateDelta: index + 1 }),
    );

    expect(mapPicks(maps).gainers).toHaveLength(5);
  });
});
