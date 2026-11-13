import { api } from "../../../services/api";
import type { Perk } from "../../../types/hero";

export async function fetchAllPerks(): Promise<Perk[]> {
  const { data } = await api.get<Perk[]>("/perks");
  return data;
}

export async function fetchPerks(slug: string): Promise<Perk[]> {
  const { data } = await api.get<Perk[]>(`/heroes/${slug}/perks`);
  return data;
}
