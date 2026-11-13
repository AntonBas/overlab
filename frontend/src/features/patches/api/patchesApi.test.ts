import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import type { Patch } from "../../../types/patch";
import { fetchPatches } from "./patchesApi";

describe("fetchPatches", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the patches from the public endpoint", async () => {
    const patches: Patch[] = [
      {
        id: 1,
        version: "2.0",
        slug: "2-0",
        title: null,
        season: null,
        releasedAt: "2026-10-01",
        notes: null,
      },
    ];
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: patches });

    await expect(fetchPatches()).resolves.toEqual(patches);
    expect(get).toHaveBeenCalledWith("/patches");
  });
});
