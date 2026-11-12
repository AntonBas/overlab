import type { DataFreshness } from "../../../types/stats";
import { DATE_LOCALE } from "../../../utils/format";

const dateFormat = new Intl.DateTimeFormat(DATE_LOCALE, {
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
