import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import { clearRequestCache } from "../../../services/requestCache";
import {
  fetchComparison,
  fetchCoverage,
  fetchFreshness,
  fetchHeroHistory,
  fetchHeroMapStats,
  fetchHistoryStart,
  fetchStats,
} from "./statsApi";

const scope = {
  queue: "COMPETITIVE",
  tier: "GOLD",
  platform: "PC",
  region: "EUROPE",
} as const;

describe("statsApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearRequestCache();
  });

  it("sends the full filter set and the abort signal for the main table", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: {} });
    const { signal } = new AbortController();

    await fetchStats(
      {
        ...scope,
        map: "all-maps",
        role: null,
        sort: "WIN_RATE",
        direction: "DESC",
      },
      signal,
    );

    expect(get).toHaveBeenCalledWith("/stats", {
      signal,
      params: {
        ...scope,
        map: "all-maps",
        role: undefined,
        sort: "WIN_RATE",
        direction: "DESC",
      },
    });
  });

  it("reads freshness and the start of history for a scope", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: {} });

    await fetchFreshness("COMPETITIVE", "GOLD", "PC", "EUROPE");
    await fetchHistoryStart("COMPETITIVE", "GOLD", "PC", "EUROPE");

    expect(get).toHaveBeenNthCalledWith(1, "/stats/freshness", {
      params: scope,
    });
    expect(get).toHaveBeenNthCalledWith(2, "/stats/history-start", {
      params: scope,
    });
  });

  it("reads per-hero stats and history with the date range", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: {} });
    const history = { ...scope, from: "2026-01-01", to: "2026-02-01" };

    await fetchHeroMapStats("ana", scope);
    await fetchHeroHistory("ana", history);

    expect(get).toHaveBeenNthCalledWith(1, "/stats/hero/ana", {
      params: scope,
    });
    expect(get).toHaveBeenNthCalledWith(2, "/stats/hero/ana/history", {
      params: history,
    });
  });

  it("compares scopes with the abort signal", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: {} });
    const { signal } = new AbortController();

    await fetchComparison({ ...scope, patch: "2.10" }, signal);

    expect(get).toHaveBeenCalledWith("/stats/compare", {
      params: { ...scope, patch: "2.10" },
      signal,
    });
  });

  it("shares one coverage request within the cache window", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

    await fetchCoverage();
    await fetchCoverage();

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/stats/coverage");
  });
});
