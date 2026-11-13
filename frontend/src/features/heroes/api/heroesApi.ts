import { api } from "../../../services/api";
import type { Hero } from "../../../types/hero";

export async function fetchHeroes(): Promise<Hero[]> {
  const { data } = await api.get<Hero[]>("/heroes");
  return data;
}

export async function fetchHero(slug: string): Promise<Hero> {
  const { data } = await api.get<Hero>(`/heroes/${slug}`);
  return data;
}
