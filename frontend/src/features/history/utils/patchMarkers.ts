import type { Patch } from "../../../types/api";
import type { ChartMarker } from "../components/LineChart";

const HOTFIX_TITLE = /hotfix/i;

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
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
