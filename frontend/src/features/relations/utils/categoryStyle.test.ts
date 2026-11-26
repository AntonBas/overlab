import { describe, expect, it } from "vitest";
import { KNOWN_CATEGORY_SLUGS, categoryStyleOf } from "./categoryStyle";

describe("categoryStyleOf", () => {
  it("covers every category of the hero roster", () => {
    expect(KNOWN_CATEGORY_SLUGS).toHaveLength(22);
  });

  it("gives each known category its own group", () => {
    const groups = new Set(
      KNOWN_CATEGORY_SLUGS.map((slug) => categoryStyleOf(slug).group),
    );
    expect(groups).toEqual(
      new Set(["playstyle", "movement", "durability", "healing", "special"]),
    );
  });

  it("falls back to a neutral style for an unknown category", () => {
    const fallback = categoryStyleOf("category-added-in-admin");
    expect(fallback.group).toBe("other");
    expect(fallback.icon).toBeDefined();
  });
});
