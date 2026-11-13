import { api } from "../../../../services/api";
import type { Guide } from "../../../../types/guide";
import type { GuidePayload } from "../types";

export async function fetchAdminGuides(): Promise<Guide[]> {
  const { data } = await api.get<Guide[]>("/admin/guides");
  return data;
}

export async function createGuide(payload: GuidePayload): Promise<Guide> {
  const { data } = await api.post<Guide>("/admin/guides", payload);
  return data;
}

export async function updateGuide(
  id: number,
  payload: GuidePayload,
): Promise<Guide> {
  const { data } = await api.put<Guide>(`/admin/guides/${id}`, payload);
  return data;
}

export async function deleteGuide(id: number): Promise<void> {
  await api.delete(`/admin/guides/${id}`);
}
