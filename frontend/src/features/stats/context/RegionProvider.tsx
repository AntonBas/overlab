import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { Region } from "../../../types/api";
import { usePersonalData } from "../../personal/context/usePersonalData";
import { savePreferences } from "../../personal/api/personalApi";
import { detectRegion, readStoredRegion, writeStoredRegion } from "../region";
import { RegionContext } from "./regionContext";

export function RegionProvider({ children }: { children: ReactNode }) {
  const { preferences, replacePreferences } = usePersonalData();
  const [stored, setStored] = useState<Region | null>(readStoredRegion);
  const detected = useMemo(() => detectRegion(), []);
  const rememberRegion = useCallback(
    (region: Region) => {
      setStored(region);
      writeStoredRegion(region);
      if (preferences && preferences.region !== region) {
        savePreferences({ ...preferences, region })
          .then(replacePreferences)
          .catch(() => undefined);
      }
    },
    [preferences, replacePreferences],
  );
  const value = useMemo(
    () => ({
      region: stored ?? preferences?.region ?? detected,
      rememberRegion,
    }),
    [stored, preferences?.region, detected, rememberRegion],
  );
  return (
    <RegionContext.Provider value={value}>{children}</RegionContext.Provider>
  );
}
