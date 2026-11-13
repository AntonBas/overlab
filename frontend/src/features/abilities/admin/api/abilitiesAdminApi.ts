import { api } from "../../../../services/api";
import type { AbilityControl } from "../../../../types/hero";
import type { AdminAbility } from "../types";

export async function fetchAdminAbilities(
  heroSlug: string,
): Promise<AdminAbility[]> {
  const { data } = await api.get<AdminAbility[]>("/admin/abilities", {
    params: { hero: heroSlug },
  });
  return data;
}

export async function updateAbilityControl(
  id: number,
  control: AbilityControl | null,
): Promise<AdminAbility> {
  const { data } = await api.put<AdminAbility>(
    `/admin/abilities/${id}/control`,
    { control },
  );
  return data;
}
