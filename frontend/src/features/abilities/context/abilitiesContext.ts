import { createContext, useContext, useEffect } from "react";
import type { Ability } from "../../../types/hero";

export type AbilityIndex = ReadonlyMap<string, Ability>;

export const AbilitiesContext = createContext<AbilityIndex>(new Map());

export function abilityKey(heroSlug: string, abilitySlug: string): string {
  return `${heroSlug}/${abilitySlug}`;
}

export const AbilitiesLoaderContext = createContext<() => void>(
  () => undefined,
);

export function useAbilityIndex(): AbilityIndex {
  const load = useContext(AbilitiesLoaderContext);
  useEffect(() => {
    load();
  }, [load]);
  return useContext(AbilitiesContext);
}
