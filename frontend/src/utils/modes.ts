import type { MapMode } from "../types/api";

export const MAP_PLACEHOLDER_URL = "/images/map-placeholder.svg";

export const MODE_DESCRIPTIONS: Record<MapMode, string> = {
  CONTROL:
    "Both teams fight over one point. Hold it to fill the capture meter; the first team to win two rounds takes the map.",
  ESCORT:
    "One team escorts a payload to the end of the route while the other tries to stop it. Sides swap each round.",
  HYBRID:
    "Capture a point first, then escort a payload along its route to the finish.",
  PUSH: "Both teams fight over a central robot and push it toward the enemy side. The team that pushes it further wins.",
  FLASHPOINT:
    "Teams capture points spread across the map, one at a time. The first team to capture three wins.",
  CLASH:
    "Both teams fight over a series of points along the map and push toward the enemy side.",
};
