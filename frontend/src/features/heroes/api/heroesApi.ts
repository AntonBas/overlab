import { api } from "../../../services/api";
import type {
  Ability,
  Hero,
  HeroCategories,
  HeroCounters,
  HeroRelations,
  Perk,
  RelatedHero,
} from "../../../types/hero";

export async function fetchHeroes(): Promise<Hero[]> {
  const { data } = await api.get<Hero[]>("/heroes");
  return data;
}

export async function fetchHero(slug: string): Promise<Hero> {
  const { data } = await api.get<Hero>(`/heroes/${slug}`);
  return data;
}

export async function fetchAllPerks(): Promise<Perk[]> {
  const { data } = await api.get<Perk[]>("/perks");
  return data;
}

export async function fetchPerks(slug: string): Promise<Perk[]> {
  const { data } = await api.get<Perk[]>(`/heroes/${slug}/perks`);
  return data;
}

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

export async function fetchHeroCategories(): Promise<HeroCategories> {
  const { data } = await api.get<HeroCategories>("/hero-categories");
  return data;
}

export async function fetchAbilities(): Promise<Ability[]> {
  const { data } = await api.get<Ability[]>("/abilities");
  return data;
}

export async function fetchHeroAbilities(slug: string): Promise<Ability[]> {
  const { data } = await api.get<Ability[]>(`/heroes/${slug}/abilities`);
  return data;
}
