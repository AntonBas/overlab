import { useMemo } from "react";
import { fetchHeroes } from "../features/heroes";
import { fetchMaps } from "../features/maps";
import type { MapMode } from "../types/map";
import { useFetch } from "./useFetch";

export interface MapVisual {
  imageUrl: string | null;
  mode: MapMode | null;
}

export function useHeroPortraits(): Record<string, string | null> {
  const heroes = useFetch(fetchHeroes, []);
  return useMemo(
    () =>
      Object.fromEntries(
        (heroes.data ?? []).map((hero) => [hero.slug, hero.portraitUrl]),
      ),
    [heroes.data],
  );
}

export function useMapVisuals(): Record<string, MapVisual> {
  const maps = useFetch(fetchMaps, []);
  return useMemo(
    () =>
      Object.fromEntries(
        (maps.data ?? []).map((map) => [
          map.slug,
          { imageUrl: map.imageUrl, mode: map.mode },
        ]),
      ),
    [maps.data],
  );
}
