import { api } from "../../../../services/api";
import { REVALIDATE } from "../../../../components/admin/adminRequest";
import type { Patch } from "../../../../types/patch";
import type { PatchPayload } from "../types";

export async function fetchPatches(): Promise<Patch[]> {
  const { data } = await api.get<Patch[]>("/patches", REVALIDATE);
  return data;
}

export async function createPatch(payload: PatchPayload): Promise<Patch> {
  const { data } = await api.post<Patch>("/admin/patches", payload);
  return data;
}

export async function updatePatch(
  id: number,
  payload: PatchPayload,
): Promise<Patch> {
  const { data } = await api.put<Patch>(`/admin/patches/${id}`, payload);
  return data;
}

export async function deletePatch(id: number): Promise<void> {
  await api.delete(`/admin/patches/${id}`);
}

export async function importPatches(): Promise<{ started: boolean }> {
  const { data } = await api.post<{ started: boolean }>(
    "/admin/collector/patches/import",
  );
  return data;
}
