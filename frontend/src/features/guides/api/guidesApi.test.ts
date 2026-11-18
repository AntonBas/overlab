import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import { fetchGuide, fetchGuides } from "./guidesApi";

describe("guidesApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("filters guides by hero and map", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

    await fetchGuides({ hero: "ana", map: "ilios" });

    expect(get).toHaveBeenCalledWith("/guides", {
      params: { hero: "ana", map: "ilios" },
    });
  });

  it("encodes the guide path", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: {} });

    await fetchGuide("a/b?c");

    expect(get).toHaveBeenCalledWith("/guides/a%2Fb%3Fc");
  });
});
