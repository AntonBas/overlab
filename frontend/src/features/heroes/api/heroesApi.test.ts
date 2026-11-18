import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import { clearRequestCache } from "../../../services/requestCache";
import { fetchHero, fetchHeroes } from "./heroesApi";

describe("heroesApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearRequestCache();
  });

  it("shares one request for the hero list within the cache window", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

    await fetchHeroes();
    await fetchHeroes();

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/heroes");
  });

  it("encodes the hero slug", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: {} });

    await fetchHero("d.va/x");

    expect(get).toHaveBeenCalledWith("/heroes/d.va%2Fx");
  });
});
