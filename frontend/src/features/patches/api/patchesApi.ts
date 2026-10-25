import { api } from "../../../services/api";
import type { Patch } from "../../../types/api";

export async function fetchPatches(): Promise<Patch[]> {
  const { data } = await api.get<Patch[]>("/patches");
  return data;
}

export async function fetchPatch(slug: string): Promise<Patch> {
  const { data } = await api.get<Patch>(`/patches/${slug}`);
  return data;
}
