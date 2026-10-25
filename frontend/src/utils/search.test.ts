import { describe, expect, it } from "vitest";
import type { Hero } from "../types/api";
import { matchHeroes } from "./search";

function hero(slug: string, name: string): Hero {
  return {
    slug,
    name,
    role: "DAMAGE",
    subrole: null,
    description: null,
    portraitUrl: null,
  };
}

const heroes = [
  hero("soldier-76", "Soldier: 76"),
  hero("lucio", "Lúcio"),
  hero("ana", "Ana"),
  hero("mei", "Mei"),
  hero("sojourn", "Sojourn"),
];

describe("matchHeroes", () => {
  it("returns nothing for an empty query", () => {
    expect(matchHeroes(heroes, "  ")).toEqual([]);
  });

  it("ignores case, accents and punctuation", () => {
    expect(matchHeroes(heroes, "lucio").map((item) => item.slug)).toEqual([
      "lucio",
    ]);
    expect(matchHeroes(heroes, "soldier 76").map((item) => item.slug)).toEqual([
      "soldier-76",
    ]);
  });

  it("puts names that start with the query before names that contain it", () => {
    expect(matchHeroes(heroes, "so").map((item) => item.slug)).toEqual([
      "soldier-76",
      "sojourn",
    ]);
    expect(matchHeroes(heroes, "n").map((item) => item.slug)).toEqual([
      "ana",
      "sojourn",
    ]);
  });

  it("limits the number of results", () => {
    expect(matchHeroes(heroes, "e", 1)).toHaveLength(1);
  });
});
