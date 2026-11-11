import { describe, expect, it } from "vitest";
import {
  ALL_MAPS,
  DEFAULT_FILTERS,
  applyCoverage,
  availableTiers,
  hasMapCoverage,
  type Coverage,
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
        "queue=competitive&tier=gold&map=rialto&platform=pc&region=europe&role=tank&sort=win_rate&direction=asc",
      ),
    );

    expect(filters).toEqual({
      queue: "COMPETITIVE",
      tier: "GOLD",
      map: "rialto",
      platform: "PC",
      region: "EUROPE",
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

const COVERAGE: Coverage = [
  {
    queue: "COMPETITIVE",
    platform: "PC",
    region: "EUROPE",
    tiers: ["ALL", "GOLD", "MASTER"],
    mapTiers: ["ALL", "GOLD"],
  },
  {
    queue: "COMPETITIVE",
    platform: "PC",
    region: "ASIA",
    tiers: ["ALL", "GOLD"],
    mapTiers: [],
  },
  {
    queue: "QUICK_PLAY",
    platform: "PC",
    region: "ASIA",
    tiers: ["ALL"],
    mapTiers: ["ALL"],
  },
];

describe("coverage", () => {
  it("keeps ranks and maps where both are collected", () => {
    const filters = applyCoverage(
      { ...DEFAULT_FILTERS, tier: "GOLD", map: "rialto" },
      COVERAGE,
    );

    expect(filters.tier).toBe("GOLD");
    expect(filters.map).toBe("rialto");
    expect(hasMapCoverage(COVERAGE, DEFAULT_FILTERS)).toBe(true);
  });

  it("keeps ranks but resets maps where only ranks are collected", () => {
    const filters = applyCoverage(
      {
        ...DEFAULT_FILTERS,
        region: "ASIA",
        tier: "GOLD",
        map: "rialto",
      },
      COVERAGE,
    );

    expect(filters.tier).toBe("GOLD");
    expect(filters.map).toBe(ALL_MAPS);
  });

  it("resets a rank that is not collected for the selected map", () => {
    const filters = applyCoverage(
      { ...DEFAULT_FILTERS, tier: "MASTER", map: "rialto" },
      COVERAGE,
    );

    expect(filters.tier).toBe("ALL");
    expect(filters.map).toBe("rialto");
  });

  it("limits a combination without collected data to overall statistics", () => {
    const filters = applyCoverage(
      {
        ...DEFAULT_FILTERS,
        platform: "CONSOLE",
        tier: "MASTER",
        map: "busan",
      },
      COVERAGE,
    );

    expect(filters.tier).toBe("ALL");
    expect(filters.map).toBe(ALL_MAPS);
  });

  it("lists the ranks collected for the selection", () => {
    expect(availableTiers(COVERAGE, DEFAULT_FILTERS)).toEqual([
      "ALL",
      "GOLD",
      "MASTER",
    ]);
    expect(
      availableTiers(COVERAGE, { ...DEFAULT_FILTERS, map: "rialto" }),
    ).toEqual(["ALL", "GOLD"]);
  });

  it("falls back to the Europe-only rule while coverage is unknown", () => {
    const europe = applyCoverage(
      { ...DEFAULT_FILTERS, tier: "GOLD", map: "rialto" },
      null,
    );
    const asia = applyCoverage(
      { ...DEFAULT_FILTERS, region: "ASIA", tier: "GOLD", map: "rialto" },
      null,
    );

    expect(europe.tier).toBe("GOLD");
    expect(europe.map).toBe("rialto");
    expect(asia.tier).toBe("ALL");
    expect(asia.map).toBe(ALL_MAPS);
  });
});

describe("default region", () => {
  it("uses the given region when the address has none", () => {
    expect(parseFilters(new URLSearchParams(), "ASIA").region).toBe("ASIA");
  });

  it("prefers the region from the address", () => {
    expect(
      parseFilters(new URLSearchParams("region=americas"), "ASIA").region,
    ).toBe("AMERICAS");
  });

  it("leaves out only the region that equals the default", () => {
    const asia: StatsFilters = { ...DEFAULT_FILTERS, region: "ASIA" };
    const europe: StatsFilters = DEFAULT_FILTERS;

    expect(toSearchParams(asia, "ASIA").has("region")).toBe(false);
    expect(toSearchParams(europe, "ASIA").get("region")).toBe("europe");
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
      direction: "ASC",
    };

    expect(parseFilters(toSearchParams(filters))).toEqual(filters);
  });
});
