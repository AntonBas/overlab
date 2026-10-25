import { describe, expect, it } from "vitest";
import type { HeroChange } from "../../../types/api";
import { sortChanges } from "./changes";

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
    ...overrides,
  };
}

const changes = [
  change({ heroName: "Ana", winRateChange: -1.5, pickRateChange: 4 }),
  change({
    heroName: "Genji",
    role: "DAMAGE",
    winRateChange: 3,
    pickRateChange: -2,
  }),
  change({
    heroName: "Mei",
    role: "DAMAGE",
    winRateChange: 0.5,
    pickRateChange: 1,
  }),
];

describe("sortChanges", () => {
  it("puts the biggest win rate gains first when descending", () => {
    expect(
      sortChanges(changes, "WIN_CHANGE", true, null).map(
        (item) => item.heroName,
      ),
    ).toEqual(["Genji", "Mei", "Ana"]);
  });

  it("puts the biggest losses first when ascending", () => {
    expect(sortChanges(changes, "WIN_CHANGE", false, null)[0].heroName).toBe(
      "Ana",
    );
  });

  it("sorts by pick rate change and by name", () => {
    expect(sortChanges(changes, "PICK_CHANGE", true, null)[0].heroName).toBe(
      "Ana",
    );
    expect(
      sortChanges(changes, "NAME", false, null).map((item) => item.heroName),
    ).toEqual(["Ana", "Genji", "Mei"]);
  });

  it("filters by role without changing the input", () => {
    const damage = sortChanges(changes, "NAME", false, "DAMAGE");
    expect(damage.map((item) => item.heroName)).toEqual(["Genji", "Mei"]);
    expect(changes).toHaveLength(3);
  });
});
