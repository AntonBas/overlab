import { useContext } from "react";
import { CoverageContext } from "./coverageContext";

export function useCoverage() {
  return useContext(CoverageContext);
}
