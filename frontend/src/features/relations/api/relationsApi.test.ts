import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import { clearRequestCache } from "../../../services/requestCache";
import {
  fetchAllRelations,
  fetchCounters,
  fetchHeroCategories,
  fetchSynergies,
} from "./relationsApi";

describe("relationsApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearRequestCache();
  });

  it("loads counters, synergies and all relations", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

    await fetchCounters("ana");
    await fetchSynergies("ana");
    await fetchAllRelations();

    expect(get).toHaveBeenNthCalledWith(1, "/heroes/ana/counters");
    expect(get).toHaveBeenNthCalledWith(2, "/heroes/ana/synergies");
    expect(get).toHaveBeenNthCalledWith(3, "/hero-relations");
  });

  it("shares one request for the hero categories within the cache window", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: {} });

    await fetchHeroCategories();
    await fetchHeroCategories();

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/hero-categories");
  });
});
