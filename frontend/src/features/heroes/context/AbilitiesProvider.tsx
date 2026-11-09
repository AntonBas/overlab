import { useEffect, useState, type ReactNode } from "react";
import { fetchAbilities } from "../api/heroesApi";
import {
  AbilitiesContext,
  abilityKey,
  type AbilityIndex,
} from "./abilitiesContext";

export function AbilitiesProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState<AbilityIndex>(new Map());

  useEffect(() => {
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
  }, []);

  return (
    <AbilitiesContext.Provider value={index}>
      {children}
    </AbilitiesContext.Provider>
  );
}
