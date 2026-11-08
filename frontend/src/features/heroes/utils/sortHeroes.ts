import type { HeroRole } from "../../../types/api";

const ROLE_ORDER: Record<HeroRole, number> = {
  TANK: 0,
  DAMAGE: 1,
  SUPPORT: 2,
};

interface SortableHero {
  role: HeroRole;
  name: string;
}

export function sortHeroesByRoleThenName<Hero extends SortableHero>(
  heroes: readonly Hero[],
): Hero[] {
  return [...heroes].sort(
    (first, second) =>
      ROLE_ORDER[first.role] - ROLE_ORDER[second.role] ||
      first.name.localeCompare(second.name),
  );
}
