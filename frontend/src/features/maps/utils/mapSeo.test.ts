import { describe, expect, it } from "vitest";
import { mapPageDescription, mapPageTitle } from "./mapSeo";

describe("mapSeo", () => {
  it("builds the title shared with the server prerender", () => {
    expect(mapPageTitle("Route 66")).toBe(
      "Route 66 Overwatch map: hero win and pick rates",
    );
  });

  it("includes the game mode in the description when it is known", () => {
    expect(mapPageDescription("Route 66", "ESCORT")).toMatch(
      /^Route 66 Overwatch Escort map: win, pick and ban rates/,
    );
    expect(mapPageDescription("Route 66", null)).toMatch(
      /^Route 66 Overwatch map: win, pick and ban rates/,
    );
  });
});
