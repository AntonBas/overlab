import { createContext, useContext } from "react";
import type { Ability } from "../../../types/hero";

export type AbilityIndex = ReadonlyMap<string, Ability>;

export const AbilitiesContext = createContext<AbilityIndex>(new Map());

export function abilityKey(heroSlug: string, abilitySlug: string): string {
  return `${heroSlug}/${abilitySlug}`;
}

export function useAbilityIndex(): AbilityIndex {
  return useContext(AbilitiesContext);
}
