import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../../services/api";
import { fetchPerks } from "./perksAdminApi";

describe("fetchPerks", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("asks the browser to revalidate the list", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

    await fetchPerks("ana");

    expect(get).toHaveBeenCalledWith("/heroes/ana/perks", {
      headers: { "Cache-Control": "no-cache" },
    });
  });
});
