import { useContext } from "react";
import { RegionContext } from "./regionContext";

export function useRegion() {
  return useContext(RegionContext);
}
