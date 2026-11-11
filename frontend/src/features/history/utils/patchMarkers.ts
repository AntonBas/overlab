import type { Patch } from "../../../types/api";
import { DATE_LOCALE } from "../../../utils/format";
import type { ChartMarker } from "../components/LineChart";

const HOTFIX_TITLE = /hotfix|bug fix/i;

const dateFormat = new Intl.DateTimeFormat(DATE_LOCALE, {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function patchName(patch: Patch): string {
  return patch.title ?? `Patch ${patch.version}`;
}

export function isHotfix(patch: Patch): boolean {
  return patch.title !== null && HOTFIX_TITLE.test(patch.title);
}

export function buildPatchMarkers(patches: Patch[]): ChartMarker[] {
  const chronological = [...patches].sort(
    (first, second) =>
      Date.parse(first.releasedAt) - Date.parse(second.releasedAt),
  );
  let latestMainPatch: Patch | null = null;
  return chronological.map((patch) => {
    const time = Date.parse(patch.releasedAt);
    if (!isHotfix(patch)) {
      latestMainPatch = patch;
      return {
        time,
        label: patchName(patch),
        detail: patch.title ? `Version ${patch.version}` : null,
        kind: "patch",
      };
    }
    const parent: Patch | null = latestMainPatch;
    return {
      time,
      label: patchName(patch),
      detail: parent
        ? `Hotfix for ${patchName(parent)} (${dateFormat.format(new Date(parent.releasedAt))})`
        : `Version ${patch.version}`,
      kind: "hotfix",
      parentLabel: parent ? patchName(parent) : null,
    };
  });
}

export function buildSeasonLookup(
  patches: Patch[],
): (time: number) => number | null {
  const starts = patches
    .filter((patch) => patch.season !== null)
    .map((patch) => ({
      time: Date.parse(patch.releasedAt),
      season: patch.season as number,
    }))
    .sort((first, second) => first.time - second.time);
  return (time) => {
    let season: number | null = null;
    for (const start of starts) {
      if (start.time > time) {
        break;
      }
      season = start.season;
    }
    return season;
  };
}
