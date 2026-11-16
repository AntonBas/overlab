import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import {
  addFavoriteHero,
  addFavoriteMap,
  fetchFavorites,
  fetchPreferences,
  removeFavoriteHero,
  removeFavoriteMap,
  savePreferences,
} from "./personalApi";

describe("personalApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds and removes favorite heroes and maps", async () => {
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: null });
    const remove = vi.spyOn(api, "delete").mockResolvedValue({ data: null });

    await addFavoriteHero("ana");
    await addFavoriteMap("ilios");
    await removeFavoriteHero("ana");
    await removeFavoriteMap("ilios");

    expect(put).toHaveBeenCalledWith("/me/favorites/heroes/ana");
    expect(put).toHaveBeenCalledWith("/me/favorites/maps/ilios");
    expect(remove).toHaveBeenCalledWith("/me/favorites/heroes/ana");
    expect(remove).toHaveBeenCalledWith("/me/favorites/maps/ilios");
  });

  it("reads favorites and reads and saves preferences", async () => {
    const preferences = {
      queue: "COMPETITIVE",
      platform: "PC",
      region: "EUROPE",
      tier: "GOLD",
    } as const;
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: preferences });
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: preferences });

    await fetchFavorites();
    await expect(fetchPreferences()).resolves.toEqual(preferences);
    await savePreferences(preferences);

    expect(get).toHaveBeenCalledWith("/me/favorites");
    expect(get).toHaveBeenCalledWith("/me/preferences");
    expect(put).toHaveBeenCalledWith("/me/preferences", preferences);
  });
});
