import { useCallback, useEffect, useState, type ReactNode } from "react";
import { fetchAbilities } from "../api/abilitiesApi";
import {
  AbilitiesContext,
  AbilitiesLoaderContext,
  abilityKey,
  type AbilityIndex,
} from "./abilitiesContext";

export function AbilitiesProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState<AbilityIndex>(new Map());
  const [requested, setRequested] = useState(false);
  const load = useCallback(() => setRequested(true), []);

  useEffect(() => {
    if (!requested) {
      return;
    }
    let cancelled = false;
    fetchAbilities()
      .then((abilities) => {
        if (!cancelled) {
          setIndex(
            new Map(
              abilities.map((ability) => [
                abilityKey(ability.heroSlug, ability.slug),
                ability,
              ]),
            ),
          );
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [requested]);

  return (
    <AbilitiesLoaderContext.Provider value={load}>
      <AbilitiesContext.Provider value={index}>
        {children}
      </AbilitiesContext.Provider>
    </AbilitiesLoaderContext.Provider>
  );
}
