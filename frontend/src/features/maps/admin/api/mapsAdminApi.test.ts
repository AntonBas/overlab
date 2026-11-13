import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../../services/api";
import { fetchAdminMaps } from "./mapsAdminApi";

describe("fetchAdminMaps", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("asks the browser to revalidate the list", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

    await fetchAdminMaps();

    expect(get).toHaveBeenCalledWith("/maps", {
      headers: { "Cache-Control": "no-cache" },
    });
  });
});
