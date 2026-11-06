import { describe, expect, it } from "vitest";
import type {
  CategoryMatchup,
  HeroCategory,
  RelatedHero,
} from "../../../types/api";
import { withoutCoveredHeroes } from "./categoryCoverage";

function related(slug: string): RelatedHero {
  return {
    slug,
    name: slug,
    role: "DAMAGE",
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
  note: null,
};

describe("withoutCoveredHeroes", () => {
  const categories = new Map([[dive.slug, dive]]);

  it("hides heroes that belong to a category of the matchup", () => {
    const result = withoutCoveredHeroes(
      [related("tracer"), related("genji"), related("ana")],
      [matchup],
      categories,
    );

    expect(result.map((hero) => hero.slug)).toEqual(["ana"]);
  });

  it("keeps everything when there are no matchups", () => {
    const result = withoutCoveredHeroes([related("tracer")], [], categories);

    expect(result).toHaveLength(1);
  });
});
