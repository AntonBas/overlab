import { describe, expect, it } from "vitest";
import type { Patch } from "../../../types/patch";
import { buildPatchMarkers, buildSeasonLookup } from "./patchMarkers";

function patch(version: string, title: string | null): Patch {
  return {
    id: Number(version.replaceAll("-", "")),
    version,
    slug: version,
    title,
    releasedAt: `${version}T18:00:00Z`,
    season: null,
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

describe("bug fix updates", () => {
  it("are drawn as hotfixes of the latest main patch", () => {
    const markers = buildPatchMarkers([
      patch("2026-10-06", "Reign of Talon - Season 5"),
      patch("2026-10-20", "Bug Fix Update"),
    ]);

    expect(markers[1].kind).toBe("hotfix");
    expect(markers[1].detail).toBe(
      "Hotfix for Reign of Talon - Season 5 (6 Oct)",
    );
  });
});

describe("buildSeasonLookup", () => {
  const seasonPatch = (version: string, season: number | null): Patch => ({
    ...patch(version, null),
    season,
  });

  it("returns the season of the latest patch released before a moment", () => {
    const seasonAt = buildSeasonLookup([
      seasonPatch("2026-12-10", 6),
      seasonPatch("2026-10-06", 5),
      seasonPatch("2026-11-05", 5),
    ]);

    expect(seasonAt(Date.parse("2026-10-20T00:00:00Z"))).toBe(5);
    expect(seasonAt(Date.parse("2026-12-10T18:00:00Z"))).toBe(6);
    expect(seasonAt(Date.parse("2027-01-01T00:00:00Z"))).toBe(6);
  });

  it("knows nothing before the first season patch", () => {
    const seasonAt = buildSeasonLookup([
      seasonPatch("2026-10-06", 5),
      seasonPatch("2026-09-01", null),
    ]);

    expect(seasonAt(Date.parse("2026-09-15T00:00:00Z"))).toBeNull();
  });
});
