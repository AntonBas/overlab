import { describe, expect, it } from "vitest";
import { heroPageDescription, heroPageTitle } from "./heroSeo";

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
});
