const NEUTRAL_WIN_RATE = 50;
const WIN_RATE_SHRINKAGE = 4;
const GAIN_SHRINKAGE = 3;

interface WinRateEntry {
  winRate: number;
  pickRate: number;
}

interface GainEntry {
  winRateDelta: number | null;
  pickRate: number;
}

function weight(pickRate: number, shrinkage: number): number {
  return pickRate / (pickRate + shrinkage);
}

export function adjustedWinRate(entry: WinRateEntry): number {
  return (
    NEUTRAL_WIN_RATE +
    (entry.winRate - NEUTRAL_WIN_RATE) *
      weight(entry.pickRate, WIN_RATE_SHRINKAGE)
  );
}

export function weightedGain(entry: GainEntry): number | null {
  if (entry.winRateDelta === null) {
    return null;
  }
  return entry.winRateDelta * weight(entry.pickRate, GAIN_SHRINKAGE);
}

export function rankPicks<T extends WinRateEntry & GainEntry>(
  entries: T[],
  size: number,
) {
  const changes = entries.flatMap((entry) => {
    const gain = weightedGain(entry);
    return gain === null ? [] : [{ entry, gain }];
  });
  const byWinRate = [...entries].sort(
    (first, second) => adjustedWinRate(second) - adjustedWinRate(first),
  );
  return {
    gainers: changes
      .filter((change) => change.gain > 0)
      .sort((first, second) => second.gain - first.gain)
      .slice(0, size)
      .map((change) => change.entry),
    droppers: changes
      .filter((change) => change.gain < 0)
      .sort((first, second) => first.gain - second.gain)
      .slice(0, size)
      .map((change) => change.entry),
    strongest: byWinRate.slice(0, size),
    weakest: byWinRate.slice(-size).reverse(),
  };
}

export function rankRelative<T extends GainEntry>(entries: T[], size: number) {
  const ranked = entries
    .flatMap((entry) => {
      const gain = weightedGain(entry);
      return gain === null ? [] : [{ entry, gain }];
    })
    .sort((first, second) => second.gain - first.gain);
  const limit = Math.min(size, Math.ceil(ranked.length / 2));
  const best = ranked.slice(0, limit);
  const worst = [...ranked]
    .reverse()
    .slice(0, limit)
    .filter((change) => !best.includes(change));
  return {
    best: best.map((change) => change.entry),
    worst: worst.map((change) => change.entry),
  };
}
