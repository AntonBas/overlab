import { describe, expect, it } from "vitest";
import { heroStat } from "../../../test/fixtures/stats";
import { adjustedWinRate, rankPicks, weightedGain } from "./ranking";

describe("adjustedWinRate", () => {
  it("pulls a rarely picked hero towards 50 percent", () => {
    const rare = heroStat({ winRate: 60, pickRate: 1 });
    const common = heroStat({ winRate: 60, pickRate: 30 });

    expect(adjustedWinRate(rare)).toBeLessThan(adjustedWinRate(common));
    expect(adjustedWinRate(rare)).toBeGreaterThan(50);
  });
});

describe("weightedGain", () => {
  it("weights the win rate change by how often the hero is picked", () => {
    const rare = heroStat({ winRateDelta: 4, pickRate: 1 });
    const common = heroStat({ winRateDelta: 4, pickRate: 30 });

    expect(weightedGain(rare)).toBeLessThan(weightedGain(common) ?? 0);
    expect(weightedGain(common)).toBeLessThan(4);
  });

  it("is unknown without a baseline", () => {
    expect(weightedGain(heroStat({ winRateDelta: null }))).toBeNull();
  });
});

describe("rankPicks", () => {
  it("keeps the requested number and the worst first in the lowest lists", () => {
    const entries = [1, 2, 3, 4, 5].map((index) =>
      heroStat({
        heroSlug: `h${index}`,
        winRate: 40 + index,
        winRateDelta: index - 3,
        pickRate: 20,
      }),
    );

    const ranked = rankPicks(entries, 2);

    expect(ranked.strongest.map((entry) => entry.heroSlug)).toEqual([
      "h5",
      "h4",
    ]);
    expect(ranked.weakest.map((entry) => entry.heroSlug)).toEqual(["h1", "h2"]);
    expect(ranked.gainers.map((entry) => entry.heroSlug)).toEqual(["h5", "h4"]);
    expect(ranked.droppers.map((entry) => entry.heroSlug)).toEqual([
      "h1",
      "h2",
    ]);
  });
});
