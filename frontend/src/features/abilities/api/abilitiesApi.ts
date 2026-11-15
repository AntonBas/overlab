import { api } from "../../../services/api";
import { cachedGet } from "../../../services/requestCache";
import type { Ability } from "../../../types/hero";

export function fetchAbilities(): Promise<Ability[]> {
  return cachedGet<Ability[]>("/abilities");
}

export async function fetchHeroAbilities(slug: string): Promise<Ability[]> {
  const { data } = await api.get<Ability[]>(`/heroes/${slug}/abilities`);
  return data;
}
