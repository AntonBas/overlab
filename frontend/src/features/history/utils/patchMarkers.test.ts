import { describe, expect, it } from "vitest";
import type { Patch } from "../../../types/api";
import { buildPatchMarkers } from "./patchMarkers";

function patch(version: string, title: string | null): Patch {
  return {
    id: Number(version.replaceAll("-", "")),
    version,
    slug: version,
    title,
    releasedAt: `${version}T18:00:00Z`,
    notes: null,
  };
}

describe("buildPatchMarkers", () => {
  const patches = [
    patch("2026-11-05", "Hotfix Update"),
    patch("2026-11-03", "Taking Reign"),
    patch("2026-10-13", "Hotfix Update"),
    patch("2026-10-06", "Season 5"),
  ];

  it("marks hotfixes and links them to the latest earlier patch", () => {
    const markers = buildPatchMarkers(patches);

    expect(markers.map((marker) => marker.kind)).toEqual([
      "patch",
      "hotfix",
      "patch",
      "hotfix",
    ]);
    expect(markers[1].parentLabel).toBe("Season 5");
    expect(markers[1].detail).toBe("Hotfix for Season 5 (6 Oct)");
    expect(markers[3].parentLabel).toBe("Taking Reign");
  });

  it("keeps the version for regular patches", () => {
    expect(buildPatchMarkers(patches)[0].detail).toBe("Version 2026-10-06");
  });

  it("falls back to the version when a hotfix has no earlier patch", () => {
    const [marker] = buildPatchMarkers([patch("2026-10-13", "Hotfix Update")]);

    expect(marker.kind).toBe("hotfix");
    expect(marker.detail).toBe("Version 2026-10-13");
    expect(marker.parentLabel).toBeNull();
  });

  it("names patches without a title by their version", () => {
    const [marker] = buildPatchMarkers([patch("2026-10-06", null)]);

    expect(marker.label).toBe("Patch 2026-10-06");
    expect(marker.kind).toBe("patch");
  });
});
