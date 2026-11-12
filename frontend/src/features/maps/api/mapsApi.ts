import { api } from "../../../services/api";
import type { GameMap } from "../../../types/map";

export async function fetchMaps(): Promise<GameMap[]> {
  const { data } = await api.get<GameMap[]>("/maps");
  return data;
}

export async function fetchMap(slug: string): Promise<GameMap> {
  const { data } = await api.get<GameMap>(`/maps/${slug}`);
  return data;
}
