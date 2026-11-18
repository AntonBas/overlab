import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import { clearRequestCache } from "../../../services/requestCache";
import { fetchAbilities, fetchHeroAbilities } from "./abilitiesApi";

describe("abilitiesApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearRequestCache();
  });

  it("loads the ability catalog once within the cache window", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

    await fetchAbilities();
    await fetchAbilities();

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/abilities");
  });

  it("loads the abilities of a hero", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

    await fetchHeroAbilities("ana");

    expect(get).toHaveBeenCalledWith("/heroes/ana/abilities");
  });
});
