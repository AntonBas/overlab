import type { MapMode } from "../../../types/map";
import { MAP_MODE_LABELS } from "../../../utils/format";

const OTHER = "Other";

export interface ModeGroup<T> {
  mode: MapMode | null;
  maps: T[];
}

export function groupByMode<T extends { mode: MapMode | null }>(
  maps: T[],
): [string, ModeGroup<T>][] {
  const groups = new Map<string, ModeGroup<T>>();
  maps.forEach((map) => {
    const label = map.mode ? MAP_MODE_LABELS[map.mode] : OTHER;
    const group = groups.get(label) ?? { mode: map.mode, maps: [] };
    groups.set(label, { ...group, maps: [...group.maps, map] });
  });
  return [...groups.entries()].sort(([first], [second]) => {
    if (first === OTHER) {
      return 1;
    }
    return second === OTHER ? -1 : first.localeCompare(second);
  });
}
