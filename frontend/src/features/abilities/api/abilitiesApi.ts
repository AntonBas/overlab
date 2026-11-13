import { api } from "../../../services/api";
import type { Ability } from "../../../types/hero";

export async function fetchAbilities(): Promise<Ability[]> {
  const { data } = await api.get<Ability[]>("/abilities");
  return data;
}

export async function fetchHeroAbilities(slug: string): Promise<Ability[]> {
  const { data } = await api.get<Ability[]>(`/heroes/${slug}/abilities`);
  return data;
}
