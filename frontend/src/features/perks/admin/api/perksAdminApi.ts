import { api } from "../../../../services/api";
import {
  REVALIDATE,
  imageForm,
} from "../../../../components/admin/adminRequest";
import type { Perk } from "../../../../types/hero";
import type { PerkPayload } from "../types";

export async function fetchPerks(heroSlug: string): Promise<Perk[]> {
  const { data } = await api.get<Perk[]>(
    `/heroes/${heroSlug}/perks`,
    REVALIDATE,
  );
  return data;
}

export async function createPerk(payload: PerkPayload): Promise<Perk> {
  const { data } = await api.post<Perk>("/admin/perks", payload);
  return data;
}

export async function updatePerk(
  id: number,
  payload: PerkPayload,
): Promise<Perk> {
  const { data } = await api.put<Perk>(`/admin/perks/${id}`, payload);
  return data;
}

export async function deletePerk(id: number): Promise<void> {
  await api.delete(`/admin/perks/${id}`);
}

export async function uploadPerkIcon(id: number, file: File): Promise<Perk> {
  const { data } = await api.put<Perk>(
    `/admin/perks/${id}/icon`,
    imageForm(file),
  );
  return data;
}

export async function removePerkIcon(id: number): Promise<Perk> {
  const { data } = await api.delete<Perk>(`/admin/perks/${id}/icon`);
  return data;
}

export async function importPerks(): Promise<{ heroes: number }> {
  const { data } = await api.post<{ heroes: number }>(
    "/admin/collector/perks/import",
  );
  return data;
}
