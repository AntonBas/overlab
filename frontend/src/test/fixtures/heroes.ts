import type { Hero } from "../../types/hero";

export function hero(overrides: Partial<Hero> = {}): Hero {
  return {
    slug: "ana",
    name: "Ana",
    role: "SUPPORT",
    subrole: "tactician",
    description: "Sniper healer",
    strengths: null,
    weaknesses: null,
    portraitUrl: null,
    recentlyAdded: false,
    ...overrides,
  };
}
