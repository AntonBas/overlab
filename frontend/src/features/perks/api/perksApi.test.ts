import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import { fetchAllPerks, fetchPerks } from "./perksApi";

describe("perksApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads every perk and the perks of one hero", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

    await fetchAllPerks();
    await fetchPerks("ana");

    expect(get).toHaveBeenNthCalledWith(1, "/perks");
    expect(get).toHaveBeenNthCalledWith(2, "/heroes/ana/perks");
  });
});
