import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  parseFilters,
  toSearchParams,
  type StatsFilters,
} from "./filters";

describe("parseFilters", () => {
  it("falls back to defaults for an empty query", () => {
    expect(parseFilters(new URLSearchParams())).toEqual(DEFAULT_FILTERS);
  });

  it("reads lower-case values from the address", () => {
    const filters = parseFilters(
      new URLSearchParams(
        "queue=competitive&tier=gold&map=rialto&platform=console&region=asia&role=tank&sort=win_rate&direction=asc",
      ),
    );

    expect(filters).toEqual({
      queue: "COMPETITIVE",
      tier: "GOLD",
      map: "rialto",
      platform: "CONSOLE",
      region: "ASIA",
      role: "TANK",
      sort: "WIN_RATE",
      direction: "ASC",
    });
  });

  it("ignores values it does not know", () => {
    const filters = parseFilters(
      new URLSearchParams(
        "queue=arcade&tier=wood&sort=speed&direction=sideways",
      ),
    );

    expect(filters.queue).toBe(DEFAULT_FILTERS.queue);
    expect(filters.tier).toBe(DEFAULT_FILTERS.tier);
    expect(filters.sort).toBe(DEFAULT_FILTERS.sort);
    expect(filters.direction).toBe(DEFAULT_FILTERS.direction);
  });

  it("forces all ranks for Quick Play", () => {
    const filters = parseFilters(
      new URLSearchParams("queue=quick_play&tier=gold"),
    );

    expect(filters.queue).toBe("QUICK_PLAY");
    expect(filters.tier).toBe("ALL");
  });
});

describe("toSearchParams", () => {
  it("leaves out values that equal the defaults", () => {
    expect(toSearchParams(DEFAULT_FILTERS).toString()).toBe("");
  });

  it("writes changed values in lower case", () => {
    const filters: StatsFilters = {
      ...DEFAULT_FILTERS,
      queue: "QUICK_PLAY",
      role: "SUPPORT",
      sort: "WIN_RATE",
    };

    const params = toSearchParams(filters);

    expect(params.get("queue")).toBe("quick_play");
    expect(params.get("role")).toBe("support");
    expect(params.get("sort")).toBe("win_rate");
    expect(params.has("tier")).toBe(false);
  });

  it("survives a round trip", () => {
    const filters: StatsFilters = {
      ...DEFAULT_FILTERS,
      tier: "PLATINUM",
      map: "blizzard-world",
      region: "AMERICAS",
      direction: "ASC",
    };

    expect(parseFilters(toSearchParams(filters))).toEqual(filters);
  });
});
