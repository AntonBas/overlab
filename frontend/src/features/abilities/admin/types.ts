import type { AbilityControl } from "../../../types/hero";

export interface AdminAbility {
  id: number;
  heroSlug: string;
  name: string;
  iconUrl: string | null;
  control: AbilityControl | null;
}
