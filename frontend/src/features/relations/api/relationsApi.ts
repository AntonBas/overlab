import { api } from "../../../services/api";
import { cachedGet } from "../../../services/requestCache";
import type {
  HeroCategories,
  HeroCounters,
  HeroRelations,
  RelatedHero,
} from "../../../types/hero";

export async function fetchCounters(slug: string): Promise<HeroCounters> {
  const { data } = await api.get<HeroCounters>(`/heroes/${slug}/counters`);
  return data;
}

export async function fetchSynergies(slug: string): Promise<RelatedHero[]> {
  const { data } = await api.get<RelatedHero[]>(`/heroes/${slug}/synergies`);
  return data;
}

export async function fetchAllRelations(): Promise<HeroRelations[]> {
  const { data } = await api.get<HeroRelations[]>("/hero-relations");
  return data;
}

export function fetchHeroCategories(): Promise<HeroCategories> {
  return cachedGet<HeroCategories>("/hero-categories");
}
