import type { HeroMapStat } from "../../../types/api";
import { rankRelative } from "../../stats/utils/ranking";

const LIST_SIZE = 5;

export interface MapPicks {
  best: HeroMapStat[];
  worst: HeroMapStat[];
}

export function mapPicks(maps: HeroMapStat[]): MapPicks {
  return rankRelative(
    maps.filter((entry) => entry.mapSlug !== null),
    LIST_SIZE,
  );
}
