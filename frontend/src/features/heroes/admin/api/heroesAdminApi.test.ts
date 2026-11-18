import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../../services/api";
import { fetchAdminHeroes, updateHero } from "./heroesAdminApi";

describe("heroesAdminApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists heroes and saves one by slug", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: {} });
    const payload = {
      description: "Sniper healer",
      strengths: null,
      weaknesses: null,
      active: true,
    };

    await fetchAdminHeroes();
    await updateHero("ana", payload);

    expect(get).toHaveBeenCalledWith("/admin/heroes");
    expect(put).toHaveBeenCalledWith("/admin/heroes/ana", payload);
  });
});
