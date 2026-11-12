import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useHeroPortraits, useMapVisuals } from "./useCatalog";

vi.mock("../features/heroes/api/heroesApi", () => ({
  fetchHeroes: async () => [
    { slug: "ana", portraitUrl: "/ana.png" },
    { slug: "reaper", portraitUrl: null },
  ],
}));
vi.mock("../features/maps/api/mapsApi", () => ({
  fetchMaps: async () => [
    { slug: "numbani", imageUrl: "/numbani.png", mode: "HYBRID", name: "N" },
  ],
}));

describe("useCatalog", () => {
  it("maps hero slugs to portrait urls", async () => {
    const { result } = renderHook(() => useHeroPortraits());

    expect(result.current).toEqual({});
    await waitFor(() =>
      expect(result.current).toEqual({ ana: "/ana.png", reaper: null }),
    );
  });

  it("maps map slugs to image and mode", async () => {
    const { result } = renderHook(() => useMapVisuals());

    await waitFor(() =>
      expect(result.current).toEqual({
        numbani: { imageUrl: "/numbani.png", mode: "HYBRID" },
      }),
    );
  });
});
