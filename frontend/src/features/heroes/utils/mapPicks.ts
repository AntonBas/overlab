import type { HeroMapStat } from "../../../types/api";
import { rankPicks } from "../../stats/utils/ranking";

const LIST_SIZE = 5;

export interface MapPicks {
  gainers: HeroMapStat[];
  strongest: HeroMapStat[];
  droppers: HeroMapStat[];
  weakest: HeroMapStat[];
}

export function mapPicks(maps: HeroMapStat[]): MapPicks {
  return rankPicks(
    maps.filter((entry) => entry.mapSlug !== null),
    LIST_SIZE,
  );
}
