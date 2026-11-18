import { api } from "../../../services/api";
import { cachedGet } from "../../../services/requestCache";
import type { Hero } from "../../../types/hero";

export function fetchHeroes(): Promise<Hero[]> {
  return cachedGet<Hero[]>("/heroes");
}

export async function fetchHero(slug: string): Promise<Hero> {
  const { data } = await api.get<Hero>(`/heroes/${encodeURIComponent(slug)}`);
  return data;
}
