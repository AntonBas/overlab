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
  it("lists the best and the weakest maps compared with the hero's average", () => {
    const picks = mapPicks([
      entry({ mapSlug: "a", winRate: 56, winRateDelta: -1 }),
      entry({ mapSlug: "b", winRate: 46, winRateDelta: 3 }),
      entry({ mapSlug: "c", winRate: 50, winRateDelta: 0.5 }),
      entry({ mapSlug: "d", winRate: 40, winRateDelta: -4 }),
    ]);

    expect(slugs(picks.best)).toEqual(["b", "c"]);
    expect(slugs(picks.worst)).toEqual(["d", "a"]);
  });

  it("still lists the weakest maps when the hero is above average on every map", () => {
    const picks = mapPicks([
      entry({ mapSlug: "a", winRate: 60, winRateDelta: 5 }),
      entry({ mapSlug: "b", winRate: 58, winRateDelta: 2 }),
    ]);

    expect(slugs(picks.best)).toEqual(["a"]);
    expect(slugs(picks.worst)).toEqual(["b"]);
  });

  it("ignores the overall row that has no map", () => {
    const picks = mapPicks([
      entry({ mapSlug: null, mapName: null, winRate: 99, winRateDelta: 9 }),
      entry({ mapSlug: "a" }),
    ]);

    expect(slugs(picks.best)).toEqual(["a"]);
  });

  it("shows at most five maps per list", () => {
    const maps = Array.from({ length: 12 }, (_, index) =>
      entry({ mapSlug: `m${index}`, winRateDelta: index + 1 }),
    );

    expect(mapPicks(maps).best).toHaveLength(5);
  });
});
