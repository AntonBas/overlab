import type { HeroHighlight } from "../../../components/ui/HeroHighlights";
import type { HeroChange } from "../../../types/stats";
import { formatDelta } from "../../../utils/format";

function highlightOf(
  change: HeroChange,
  key: string,
  label: string,
  value: number,
  tone: HeroHighlight["tone"],
  portraits: Record<string, string | null>,
): HeroHighlight {
  return {
    key,
    label,
    heroSlug: change.heroSlug,
    heroName: change.heroName,
    role: change.role,
    portraitUrl: portraits[change.heroSlug] ?? null,
    value: `${formatDelta(value)}%`,
    tone,
  };
}

export function changeHighlights(
  changes: HeroChange[],
  portraits: Record<string, string | null>,
): HeroHighlight[] {
  const byWin = [...changes].sort(
    (first, second) => second.winRateChange - first.winRateChange,
  );
  const gain = byWin[0];
  const drop = byWin[byWin.length - 1];
  const risingPick = [...changes].sort(
    (first, second) => second.pickRateChange - first.pickRateChange,
  )[0];
  const items: HeroHighlight[] = [];
  if (gain && gain.winRateChange > 0) {
    items.push(
      highlightOf(
        gain,
        "gain",
        "Biggest win rate gain",
        gain.winRateChange,
        "up",
        portraits,
      ),
    );
  }
  if (drop && drop.winRateChange < 0) {
    items.push(
      highlightOf(
        drop,
        "drop",
        "Biggest win rate drop",
        drop.winRateChange,
        "down",
        portraits,
      ),
    );
  }
  if (risingPick && risingPick.pickRateChange > 0) {
    items.push(
      highlightOf(
        risingPick,
        "pick",
        "Pick rate rising most",
        risingPick.pickRateChange,
        "pick",
        portraits,
      ),
    );
  }
  return items;
}
