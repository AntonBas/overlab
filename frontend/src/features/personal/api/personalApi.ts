import { api } from "../../../services/api";
import type { Favorites, Preferences } from "../../../types/api";

export async function fetchFavorites(): Promise<Favorites> {
  const { data } = await api.get<Favorites>("/me/favorites");
  return data;
}

export async function addFavoriteHero(slug: string): Promise<void> {
  await api.put(`/me/favorites/heroes/${slug}`);
}

export async function removeFavoriteHero(slug: string): Promise<void> {
  await api.delete(`/me/favorites/heroes/${slug}`);
}

export async function addFavoriteMap(slug: string): Promise<void> {
  await api.put(`/me/favorites/maps/${slug}`);
}

export async function removeFavoriteMap(slug: string): Promise<void> {
  await api.delete(`/me/favorites/maps/${slug}`);
}

export async function fetchPreferences(): Promise<Preferences> {
  const { data } = await api.get<Preferences>("/me/preferences");
  return data;
}

export async function savePreferences(
  preferences: Preferences,
): Promise<Preferences> {
  const { data } = await api.put<Preferences>("/me/preferences", preferences);
  return data;
}
