import type { DataFreshness } from "../../../types/api";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function describeFreshness(freshness: DataFreshness): string | null {
  if (freshness.snapshotCount < 2) {
    return null;
  }
  const date = dateFormat.format(new Date(freshness.valuesSince));
  return freshness.changeObserved
    ? `Blizzard last changed these numbers on ${date}.`
    : `Blizzard has not changed these numbers since we started collecting on ${date}.`;
}
