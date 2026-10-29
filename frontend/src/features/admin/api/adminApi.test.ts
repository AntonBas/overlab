import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import { fetchAdminMaps, fetchPatches, fetchPerks } from "./adminApi";

describe("admin lists that read public endpoints", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["perks", () => fetchPerks("ana"), "/heroes/ana/perks"],
    ["maps", () => fetchAdminMaps(), "/maps"],
    ["patches", () => fetchPatches(), "/patches"],
  ])(
    "asks the browser to revalidate the %s list",
    async (_name, load, path) => {
      const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

      await load();

      expect(get).toHaveBeenCalledWith(path, {
        headers: { "Cache-Control": "no-cache" },
      });
    },
  );
});
