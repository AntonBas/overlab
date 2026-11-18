import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { cachedGet, clearRequestCache } from "./requestCache";

describe("cachedGet", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearRequestCache();
  });

  it("shares one request between callers", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: ["ana"] });

    const [first, second] = await Promise.all([
      cachedGet<string[]>("/heroes"),
      cachedGet<string[]>("/heroes"),
    ]);

    expect(first).toEqual(["ana"]);
    expect(second).toBe(first);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("does not keep a failed request", async () => {
    const get = vi
      .spyOn(api, "get")
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValueOnce({ data: ["ana"] });

    await expect(cachedGet("/heroes")).rejects.toThrow("down");
    await expect(cachedGet("/heroes")).resolves.toEqual(["ana"]);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("asks again after the cache is cleared", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: ["ana"] });

    await cachedGet("/heroes");
    clearRequestCache();
    await cachedGet("/heroes");

    expect(get).toHaveBeenCalledTimes(2);
  });
});
