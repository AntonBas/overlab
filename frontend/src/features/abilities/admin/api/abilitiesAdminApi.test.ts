import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../../services/api";
import { fetchAdminAbilities, updateAbilityControl } from "./abilitiesAdminApi";

describe("abilitiesAdminApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists the abilities of one hero", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

    await expect(fetchAdminAbilities("ana")).resolves.toEqual([]);

    expect(get).toHaveBeenCalledWith("/admin/abilities", {
      params: { hero: "ana" },
    });
  });

  it("sets and clears the key of an ability", async () => {
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: {} });

    await updateAbilityControl(4, "SECONDARY_FIRE");
    await updateAbilityControl(4, null);

    expect(put).toHaveBeenNthCalledWith(1, "/admin/abilities/4/control", {
      control: "SECONDARY_FIRE",
    });
    expect(put).toHaveBeenNthCalledWith(2, "/admin/abilities/4/control", {
      control: null,
    });
  });
});
