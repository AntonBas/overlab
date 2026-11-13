import { api } from "../../../../services/api";
import {
  REVALIDATE,
  imageForm,
} from "../../../../components/admin/adminRequest";
import type { GameMap } from "../../../../types/map";
import type { MapPayload } from "../types";

export async function fetchAdminMaps(): Promise<GameMap[]> {
  const { data } = await api.get<GameMap[]>("/maps", REVALIDATE);
  return data;
}

export async function updateMap(
  slug: string,
  payload: MapPayload,
): Promise<GameMap> {
  const { data } = await api.put<GameMap>(`/admin/maps/${slug}`, payload);
  return data;
}

export async function uploadMapImage(
  slug: string,
  file: File,
): Promise<GameMap> {
  const { data } = await api.put<GameMap>(
    `/admin/maps/${slug}/image`,
    imageForm(file),
  );
  return data;
}

export async function removeMapImage(slug: string): Promise<GameMap> {
  const { data } = await api.delete<GameMap>(`/admin/maps/${slug}/image`);
  return data;
}
