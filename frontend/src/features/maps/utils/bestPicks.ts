import type { HeroRole, HeroStat } from "../../../types/api";
import { rankPicks } from "../../stats/utils/ranking";

export interface RolePicks {
  role: HeroRole;
  gainers: HeroStat[];
  strongest: HeroStat[];
  droppers: HeroStat[];
  weakest: HeroStat[];
}

const ROLE_ORDER: HeroRole[] = ["TANK", "DAMAGE", "SUPPORT"];
const LIST_SIZE = 3;

export function picksByRole(heroes: HeroStat[]): RolePicks[] {
  return ROLE_ORDER.flatMap((role) => {
    const inRole = heroes.filter((hero) => hero.role === role);
    return inRole.length === 0
      ? []
      : [{ role, ...rankPicks(inRole, LIST_SIZE) }];
  });
}
