import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  CONTROL_SCHEMES,
  ControlSchemeContext,
  type ControlScheme,
} from "./controlSchemeContext";

const STORAGE_KEY = "overlab.controlScheme";

function readStoredScheme(): ControlScheme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return CONTROL_SCHEMES.find((scheme) => scheme === stored) ?? "PC";
  } catch {
    return "PC";
  }
}

export function ControlSchemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setSchemeState] = useState<ControlScheme>(readStoredScheme);

  const setScheme = useCallback((next: ControlScheme) => {
    setSchemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      return;
    }
  }, []);

  const value = useMemo(() => ({ scheme, setScheme }), [scheme, setScheme]);

  return (
    <ControlSchemeContext.Provider value={value}>
      {children}
    </ControlSchemeContext.Provider>
  );
}
