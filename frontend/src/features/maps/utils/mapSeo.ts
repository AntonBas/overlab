import type { MapMode } from "../../../types/map";
import { MAP_MODE_LABELS } from "../../../utils/format";

export function mapPageTitle(name: string): string {
  return `${name} Overwatch map: hero win and pick rates`;
}

export function mapPageDescription(
  name: string,
  mode: MapMode | null | undefined,
): string {
  const modePart = mode ? ` ${MAP_MODE_LABELS[mode]}` : "";
  return `${name} Overwatch${modePart} map: win, pick and ban rates of every hero on it, plus the best and worst picks. Updated from Blizzard public data.`;
}
