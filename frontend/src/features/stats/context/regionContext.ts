import { createContext } from "react";
import type { Region } from "../../../types/api";

export interface RegionValue {
  region: Region;
  rememberRegion: (region: Region) => void;
}

export const RegionContext = createContext<RegionValue>({
  region: "EUROPE",
  rememberRegion: () => undefined,
});
