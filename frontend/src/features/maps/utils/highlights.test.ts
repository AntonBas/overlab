import { describe, expect, it } from "vitest";
import { heroStat } from "../../../test/fixtures";
import { mapHighlights } from "./highlights";

describe("mapHighlights", () => {
  it("returns the biggest gains and losses, best first", () => {
    const heroes = [
      heroStat({ heroSlug: "a", winRateDelta: 1 }),
      heroStat({ heroSlug: "b", winRateDelta: 4 }),
      heroStat({ heroSlug: "c", winRateDelta: -3 }),
      heroStat({ heroSlug: "d", winRateDelta: -1 }),
      heroStat({ heroSlug: "e", winRateDelta: null }),
    ];

    const { best, worst } = mapHighlights(heroes);

    expect(best.map((hero) => hero.heroSlug)).toEqual(["b", "a"]);
    expect(worst.map((hero) => hero.heroSlug)).toEqual(["c", "d"]);
  });

  it("ignores heroes that are almost never picked", () => {
    const heroes = [
      heroStat({ heroSlug: "rare", pickRate: 0.5, winRateDelta: 9 }),
      heroStat({ heroSlug: "common", pickRate: 10, winRateDelta: 2 }),
    ];

    expect(mapHighlights(heroes).best.map((hero) => hero.heroSlug)).toEqual([
      "common",
    ]);
  });

  it("keeps at most three of each", () => {
    const heroes = Array.from({ length: 6 }, (_, index) =>
      heroStat({ heroSlug: `h${index}`, winRateDelta: index + 1 }),
    );

    expect(mapHighlights(heroes).best).toHaveLength(3);
  });
});
