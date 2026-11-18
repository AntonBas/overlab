import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import { clearRequestCache } from "../../../services/requestCache";
import { fetchMap, fetchMaps } from "./mapsApi";

describe("mapsApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearRequestCache();
  });

  it("shares one request for the map list within the cache window", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

    await fetchMaps();
    await fetchMaps();

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/maps");
  });

  it("encodes the map slug", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: {} });

    await fetchMap("king's row");

    expect(get).toHaveBeenCalledWith("/maps/king's%20row");
  });
});
