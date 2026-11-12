import { api } from "../../../services/api";
import type { Patch } from "../../../types/patch";

export async function fetchPatches(): Promise<Patch[]> {
  const { data } = await api.get<Patch[]>("/patches");
  return data;
}
