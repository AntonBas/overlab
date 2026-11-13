import { api } from "../../../../services/api";
import type {
  AdminCategory,
  AdminCategoryMatchup,
  CategoryMatchupPayload,
  CategoryPayload,
  HeroRelation,
  RelationPayload,
  RelationVoteSummary,
} from "../types";

export async function fetchRelations(
  heroSlug?: string,
): Promise<HeroRelation[]> {
  const { data } = await api.get<HeroRelation[]>("/admin/hero-relations", {
    params: heroSlug ? { hero: heroSlug } : undefined,
  });
  return data;
}

export async function createRelation(
  payload: RelationPayload,
): Promise<HeroRelation> {
  const { data } = await api.post<HeroRelation>(
    "/admin/hero-relations",
    payload,
  );
  return data;
}

export async function updateRelation(
  id: number,
  payload: RelationPayload,
): Promise<HeroRelation> {
  const { data } = await api.put<HeroRelation>(
    `/admin/hero-relations/${id}`,
    payload,
  );
  return data;
}

export async function deleteRelation(id: number): Promise<void> {
  await api.delete(`/admin/hero-relations/${id}`);
}

export async function fetchCategories(): Promise<AdminCategory[]> {
  const { data } = await api.get<AdminCategory[]>("/admin/hero-categories");
  return data;
}

export async function createCategory(
  payload: CategoryPayload,
): Promise<AdminCategory> {
  const { data } = await api.post<AdminCategory>(
    "/admin/hero-categories",
    payload,
  );
  return data;
}

export async function updateCategory(
  id: number,
  payload: CategoryPayload,
): Promise<AdminCategory> {
  const { data } = await api.put<AdminCategory>(
    `/admin/hero-categories/${id}`,
    payload,
  );
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/admin/hero-categories/${id}`);
}

export async function fetchCategoryMatchups(): Promise<AdminCategoryMatchup[]> {
  const { data } = await api.get<AdminCategoryMatchup[]>(
    "/admin/hero-category-relations",
  );
  return data;
}

export async function createCategoryMatchup(
  payload: CategoryMatchupPayload,
): Promise<AdminCategoryMatchup> {
  const { data } = await api.post<AdminCategoryMatchup>(
    "/admin/hero-category-relations",
    payload,
  );
  return data;
}

export async function updateCategoryMatchup(
  id: number,
  payload: CategoryMatchupPayload,
): Promise<AdminCategoryMatchup> {
  const { data } = await api.put<AdminCategoryMatchup>(
    `/admin/hero-category-relations/${id}`,
    payload,
  );
  return data;
}

export async function deleteCategoryMatchup(id: number): Promise<void> {
  await api.delete(`/admin/hero-category-relations/${id}`);
}

export async function fetchRelationVoteSummary(): Promise<
  RelationVoteSummary[]
> {
  const { data } = await api.get<RelationVoteSummary[]>(
    "/admin/relation-votes/summary",
  );
  return data;
}
