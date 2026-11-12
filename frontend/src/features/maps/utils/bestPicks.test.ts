import { describe, expect, it } from "vitest";
import { heroStat } from "../../../test/fixtures/stats";
import { picksByRole } from "./bestPicks";

function slugs(heroes: { heroSlug: string }[]): string[] {
  return heroes.map((hero) => hero.heroSlug);
}

describe("picksByRole", () => {
  it("lists the biggest gains of a role, three at most, best first", () => {
    const heroes = [1, 2, 3, 4].map((gain) =>
      heroStat({
        heroSlug: `h${gain}`,
        role: "TANK",
        winRateDelta: gain,
        pickRate: 20,
      }),
    );

    const [tank] = picksByRole(heroes);

    expect(slugs(tank.gainers)).toEqual(["h4", "h3", "h2"]);
  });

  it("lists the highest win rates separately from the biggest gains", () => {
    const heroes = [
      heroStat({
        heroSlug: "strong",
        role: "TANK",
        winRate: 56,
        winRateDelta: -1,
        pickRate: 20,
      }),
      heroStat({
        heroSlug: "improved",
        role: "TANK",
        winRate: 45,
        winRateDelta: 3,
        pickRate: 20,
      }),
    ];

    const [tank] = picksByRole(heroes);

    expect(slugs(tank.strongest)[0]).toBe("strong");
    expect(slugs(tank.gainers)).toEqual(["improved"]);
  });

  it("never lists a hero as a gainer when the map costs win rate", () => {
    const heroes = [
      heroStat({
        heroSlug: "loses",
        role: "DAMAGE",
        winRateDelta: -2,
        pickRate: 20,
      }),
      heroStat({
        heroSlug: "flat",
        role: "DAMAGE",
        winRateDelta: 0,
        pickRate: 20,
      }),
    ];

    const [damage] = picksByRole(heroes);

    expect(damage.gainers).toEqual([]);
    expect(damage.strongest).toHaveLength(2);
  });

  it("does not let a rarely picked hero with a lucky swing beat a common one", () => {
    const heroes = [
      heroStat({
        heroSlug: "rare",
        role: "TANK",
        winRate: 58,
        winRateDelta: 3,
        pickRate: 0.5,
      }),
      heroStat({
        heroSlug: "common",
        role: "TANK",
        winRate: 54,
        winRateDelta: 2,
        pickRate: 25,
      }),
      heroStat({
        heroSlug: "mid",
        role: "TANK",
        winRate: 53,
        winRateDelta: 1.5,
        pickRate: 25,
      }),
    ];

    const [tank] = picksByRole(heroes);

    expect(slugs(tank.gainers).slice(0, 2)).toEqual(["common", "mid"]);
    expect(slugs(tank.strongest).slice(0, 2)).toEqual(["common", "mid"]);
  });

  it("ranks a hero picked about 5 percent of the time by the real gain, not behind a hugely popular one", () => {
    const heroes = [
      heroStat({
        heroSlug: "popular",
        role: "DAMAGE",
        winRateDelta: 2.3,
        pickRate: 21.5,
      }),
      heroStat({
        heroSlug: "niche",
        role: "DAMAGE",
        winRateDelta: 3.7,
        pickRate: 5,
      }),
    ];

    const [damage] = picksByRole(heroes);

    expect(slugs(damage.gainers)).toEqual(["niche", "popular"]);
  });

  it("lists the biggest drops and the lowest win rates, worst first", () => {
    const heroes = [
      heroStat({
        heroSlug: "ok",
        role: "SUPPORT",
        winRate: 51,
        winRateDelta: 0.5,
        pickRate: 20,
      }),
      heroStat({
        heroSlug: "drop",
        role: "SUPPORT",
        winRate: 47,
        winRateDelta: -3,
        pickRate: 20,
      }),
      heroStat({
        heroSlug: "low",
        role: "SUPPORT",
        winRate: 44,
        winRateDelta: -0.5,
        pickRate: 20,
      }),
      heroStat({
        heroSlug: "dip",
        role: "SUPPORT",
        winRate: 52,
        winRateDelta: -1,
        pickRate: 20,
      }),
    ];

    const [support] = picksByRole(heroes);

    expect(slugs(support.droppers)).toEqual(["drop", "dip", "low"]);
    expect(slugs(support.weakest)).toEqual(["low", "drop", "ok"]);
  });

  it("does not call a hero a dropper when the map helps", () => {
    const heroes = [
      heroStat({
        heroSlug: "helped",
        role: "TANK",
        winRate: 44,
        winRateDelta: 1.4,
        pickRate: 20,
      }),
    ];

    const [tank] = picksByRole(heroes);

    expect(tank.droppers).toEqual([]);
    expect(slugs(tank.weakest)).toEqual(["helped"]);
  });

  it("groups by role in a fixed order and skips roles without heroes", () => {
    const heroes = [
      heroStat({ heroSlug: "s1", role: "SUPPORT" }),
      heroStat({ heroSlug: "t1", role: "TANK" }),
    ];

    expect(picksByRole(heroes).map((entry) => entry.role)).toEqual([
      "TANK",
      "SUPPORT",
    ]);
  });
});
