import { describe, expect, it } from "vitest";
import type { HeroRelation } from "../types";
import { describeRelationConflict } from "./relations";

const existing: HeroRelation[] = [
  {
    id: 1,
    heroSlug: "ana",
    relatedHeroSlug: "genji",
    type: "COUNTER",
    strength: 2,
    note: null,
  },
];

describe("describeRelationConflict", () => {
  it("rejects a hero related to itself", () => {
    expect(
      describeRelationConflict(
        { heroSlug: "ana", relatedHeroSlug: "ana", type: "COUNTER" },
        existing,
        null,
      ),
    ).toMatch(/itself/);
  });

  it("detects a duplicate and a reverse relation of the same type", () => {
    expect(
      describeRelationConflict(
        { heroSlug: "ana", relatedHeroSlug: "genji", type: "COUNTER" },
        existing,
        null,
      ),
    ).toMatch(/already exists/);
    expect(
      describeRelationConflict(
        { heroSlug: "genji", relatedHeroSlug: "ana", type: "COUNTER" },
        existing,
        null,
      ),
    ).toMatch(/reverse/);
  });

  it("allows another type, or the relation being edited", () => {
    expect(
      describeRelationConflict(
        { heroSlug: "ana", relatedHeroSlug: "genji", type: "SYNERGY" },
        existing,
        null,
      ),
    ).toBeNull();
    expect(
      describeRelationConflict(
        { heroSlug: "ana", relatedHeroSlug: "genji", type: "COUNTER" },
        existing,
        1,
      ),
    ).toBeNull();
  });
});
