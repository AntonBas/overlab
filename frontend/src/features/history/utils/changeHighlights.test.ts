import { describe, expect, it } from "vitest";
import type { HeroChange } from "../../../types/stats";
import { changeHighlights } from "./changeHighlights";

function change(overrides: Partial<HeroChange>): HeroChange {
  return {
    heroSlug: "ana",
    heroName: "Ana",
    role: "SUPPORT",
    winRateBefore: 50,
    winRateAfter: 50,
    winRateChange: 0,
    pickRateBefore: 10,
    pickRateAfter: 10,
    pickRateChange: 0,
    banRateBefore: null,
    banRateAfter: null,
    banRateChange: null,
    roleChange: null,
    ...overrides,
  };
}

describe("changeHighlights", () => {
  const changes = [
    change({ heroSlug: "ana", heroName: "Ana", winRateChange: 1.6 }),
    change({
      heroSlug: "mei",
      heroName: "Mei",
      winRateChange: -2.4,
      pickRateChange: 0.9,
    }),
    change({ heroSlug: "zarya", heroName: "Zarya", winRateChange: 0.2 }),
  ];

  it("names the biggest gain, the biggest drop and the rising pick rate", () => {
    const items = changeHighlights(changes, {});

    expect(items.map((item) => [item.key, item.heroName])).toEqual([
      ["gain", "Ana"],
      ["drop", "Mei"],
      ["pick", "Mei"],
    ]);
  });

  it("skips a card when nothing moved in that direction", () => {
    const items = changeHighlights(
      [change({ winRateChange: 0.5, pickRateChange: 0 })],
      {},
    );

    expect(items.map((item) => item.key)).toEqual(["gain"]);
  });

  it("uses the portrait of the hero when it is known", () => {
    const items = changeHighlights(changes, { ana: "/media/ana.webp" });

    expect(items[0].portraitUrl).toBe("/media/ana.webp");
  });
});
