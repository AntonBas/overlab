import { api } from "../../../../services/api";
import type { AdminHero } from "../types";

export async function fetchAdminHeroes(): Promise<AdminHero[]> {
  const { data } = await api.get<AdminHero[]>("/admin/heroes");
  return data;
}

export async function updateHero(
  slug: string,
  payload: {
    description: string | null;
    strengths: string | null;
    weaknesses: string | null;
    active: boolean;
  },
): Promise<AdminHero> {
  const { data } = await api.put<AdminHero>(`/admin/heroes/${slug}`, payload);
  return data;
}
