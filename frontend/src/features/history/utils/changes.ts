import type { HeroChange } from "../../../types/stats";

export type ChangeSort = "WIN_CHANGE" | "PICK_CHANGE" | "BAN_CHANGE" | "NAME";

function compareNullable(
  first: number | null,
  second: number | null,
  factor: number,
): number {
  if (first === null || second === null) {
    return Number(first === null) - Number(second === null);
  }
  return factor * (first - second);
}

export function sortChanges(
  changes: HeroChange[],
  sort: ChangeSort,
  descending: boolean,
): HeroChange[] {
  const factor = descending ? -1 : 1;
  return [...changes].sort((first, second) => {
    switch (sort) {
      case "WIN_CHANGE":
        return factor * (first.winRateChange - second.winRateChange);
      case "PICK_CHANGE":
        return factor * (first.pickRateChange - second.pickRateChange);
      case "BAN_CHANGE":
        return compareNullable(
          first.banRateChange,
          second.banRateChange,
          factor,
        );
      case "NAME":
        return factor * first.heroName.localeCompare(second.heroName);
    }
  });
}
