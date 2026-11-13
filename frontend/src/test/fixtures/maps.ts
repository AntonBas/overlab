import type { GameMap } from "../../types/map";

export function gameMap(overrides: Partial<GameMap> = {}): GameMap {
  return {
    slug: "busan",
    name: "Busan",
    mode: "CONTROL",
    imageUrl: null,
    ...overrides,
  };
}
