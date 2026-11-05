import { describe, expect, it } from "vitest";
import type {
  CategoryMatchup,
  HeroCategory,
  RelatedHero,
} from "../../../types/api";
import { withoutCoveredHeroes } from "./categoryCoverage";

function related(slug: string, strength: number): RelatedHero {
  return {
    slug,
    name: slug,
    role: "DAMAGE",
    strength,
    note: null,
    portraitUrl: null,
  };
}

const dive: HeroCategory = {
  slug: "dive",
  name: "Dive",
  description: null,
  heroes: [
    { slug: "tracer", name: "Tracer", role: "DAMAGE", portraitUrl: null },
    { slug: "genji", name: "Genji", role: "DAMAGE", portraitUrl: null },
  ],
};

const matchup: CategoryMatchup = {
  heroSlug: "brigitte",
  categorySlug: "dive",
  type: "STRONG_AGAINST",
  strength: 2,
  note: null,
};

describe("withoutCoveredHeroes", () => {
  const categories = new Map([[dive.slug, dive]]);

  it("hides heroes of a category when the relation is not stronger than the matchup", () => {
    const result = withoutCoveredHeroes(
      [related("tracer", 2), related("genji", 1), related("ana", 1)],
      [matchup],
      categories,
    );

    expect(result.map((hero) => hero.slug)).toEqual(["ana"]);
  });

  it("keeps a hero whose relation is stronger than the matchup", () => {
    const result = withoutCoveredHeroes(
      [related("tracer", 3), related("genji", 2)],
      [matchup],
      categories,
    );

    expect(result.map((hero) => hero.slug)).toEqual(["tracer"]);
  });

  it("keeps everything when there are no matchups", () => {
    const result = withoutCoveredHeroes([related("tracer", 1)], [], categories);

    expect(result).toHaveLength(1);
  });
});
