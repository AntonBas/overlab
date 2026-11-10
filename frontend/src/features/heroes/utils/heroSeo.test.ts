import { describe, expect, it } from "vitest";
import type { HeroMapStat } from "../../../types/api";
import {
  SECTION_COPY,
  heroPageDescription,
  heroPageTitle,
  heroStatsSentence,
} from "./heroSeo";

const overall: HeroMapStat = {
  mapSlug: null,
  mapName: null,
  mode: null,
  winRate: 50.25,
  pickRate: 25.4,
  banRate: 7.6,
  winRateDelta: null,
  pickRateDelta: null,
  capturedAt: "2026-01-01T00:00:00Z",
};

describe("hero seo copy", () => {
  it("puts the searched topics in the hero title", () => {
    expect(heroPageTitle("Ana")).toBe(
      "Ana stats, perks, counters and best maps",
    );
  });

  it("keeps descriptions within the search snippet length", () => {
    const description = heroPageDescription("Ana", "word ".repeat(100));

    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toContain("Ana Overwatch 2 stats");
  });

  it("names the hero in every section title and description", () => {
    for (const copy of Object.values(SECTION_COPY)) {
      expect(copy.title("Ana")).toContain("Ana");
      expect(copy.heading("Ana")).toContain("Ana");
      expect(copy.description("Ana")).toContain("Ana");
    }
  });
});

describe("heroStatsSentence", () => {
  it("describes competitive stats with the ban rate", () => {
    expect(heroStatsSentence("Ana", overall, true)).toBe(
      "In Competitive (all ranks, PC, Europe) Ana has a 50.3% win rate, a 25.4% pick rate and a 7.6% ban rate.",
    );
  });

  it("leaves the ban rate out of quick play", () => {
    expect(heroStatsSentence("Ana", overall, false)).toBe(
      "In Quick Play (all ranks, PC, Europe) Ana has a 50.3% win rate, a 25.4% pick rate.",
    );
  });

  it("returns nothing without statistics", () => {
    expect(heroStatsSentence("Ana", null, true)).toBeNull();
  });
});
