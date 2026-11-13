import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../../services/api";
import { fetchPatches } from "./patchesAdminApi";

describe("fetchPatches", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("asks the browser to revalidate the list", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

    await fetchPatches();

    expect(get).toHaveBeenCalledWith("/patches", {
      headers: { "Cache-Control": "no-cache" },
    });
  });
});
