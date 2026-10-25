import type { HeroChange, HeroRole } from "../../../types/api";

export type ChangeSort = "WIN_CHANGE" | "PICK_CHANGE" | "NAME";

export function sortChanges(
  changes: HeroChange[],
  sort: ChangeSort,
  descending: boolean,
  role: HeroRole | null,
): HeroChange[] {
  const factor = descending ? -1 : 1;
  return changes
    .filter((change) => role === null || change.role === role)
    .sort((first, second) => {
      switch (sort) {
        case "WIN_CHANGE":
          return factor * (first.winRateChange - second.winRateChange);
        case "PICK_CHANGE":
          return factor * (first.pickRateChange - second.pickRateChange);
        case "NAME":
          return factor * first.heroName.localeCompare(second.heroName);
      }
    });
}
