import type { ReactNode } from "react";
import { useFetch } from "../../../hooks/useFetch";
import { fetchCoverage } from "../api/statsApi";
import { CoverageContext } from "./coverageContext";

export function CoverageProvider({ children }: { children: ReactNode }) {
  const coverage = useFetch(fetchCoverage, []);
  return (
    <CoverageContext.Provider value={coverage.data ?? null}>
      {children}
    </CoverageContext.Provider>
  );
}
