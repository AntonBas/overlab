import { api } from "../../../services/api";
import { cachedGet } from "../../../services/requestCache";
import type { GameMap } from "../../../types/map";

export function fetchMaps(): Promise<GameMap[]> {
  return cachedGet<GameMap[]>("/maps");
}

export async function fetchMap(slug: string): Promise<GameMap> {
  const { data } = await api.get<GameMap>(`/maps/${slug}`);
  return data;
}
