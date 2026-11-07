import type { HeroMapStat } from "../../../types/api";
import { rankRelative, weightedGain } from "../../stats/utils/ranking";

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

export function mapsByGain(maps: HeroMapStat[]): HeroMapStat[] {
  return maps
    .flatMap((entry) => {
      const gain = entry.mapSlug === null ? null : weightedGain(entry);
      return gain === null ? [] : [{ entry, gain }];
    })
    .sort((first, second) => second.gain - first.gain)
    .map((ranked) => ranked.entry);
}
