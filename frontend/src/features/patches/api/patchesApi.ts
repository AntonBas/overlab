import { cachedGet } from "../../../services/requestCache";
import type { Patch } from "../../../types/patch";

export function fetchPatches(): Promise<Patch[]> {
  return cachedGet<Patch[]>("/patches");
}
