import type { AxiosAdapter, AxiosResponse } from "axios";
import axios, { AxiosError } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

function unauthorized(config: AxiosResponse["config"]): AxiosError {
  return new AxiosError("Unauthorized", "ERR", config, null, {
    status: 401,
    statusText: "",
    headers: {},
    config,
    data: {},
  });
}

describe("session refresh", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    api.defaults.adapter = undefined;
    window.localStorage.clear();
  });

  it("refreshes the session and retries when the current user request is unauthorized", async () => {
    let calls = 0;
    const adapter: AxiosAdapter = (config) => {
      calls += 1;
      if (calls === 1) {
        return Promise.reject(unauthorized(config));
      }
      return Promise.resolve({
        data: { id: 1 },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      });
    };
    api.defaults.adapter = adapter;
    const refresh = vi
      .spyOn(axios, "post")
      .mockResolvedValue({ status: 200 } as AxiosResponse);

    const response = await api.get("/auth/me");

    expect(refresh).toHaveBeenCalledWith("/api/auth/refresh", null, {
      withCredentials: true,
    });
    expect(response.data).toEqual({ id: 1 });
    expect(calls).toBe(2);
  });

  it("does not try to refresh after a failed login", async () => {
    api.defaults.adapter = (config) => Promise.reject(unauthorized(config));
    const refresh = vi.spyOn(axios, "post");

    await expect(api.post("/auth/login", {})).rejects.toBeInstanceOf(
      AxiosError,
    );

    expect(refresh).not.toHaveBeenCalled();
  });

  it("does not ask for a refresh when the visitor is known to be signed out", async () => {
    window.localStorage.setItem("overlab.session", "ended");
    api.defaults.adapter = (config) => Promise.reject(unauthorized(config));
    const refresh = vi.spyOn(axios, "post");

    await expect(api.get("/auth/me")).rejects.toBeInstanceOf(AxiosError);

    expect(refresh).not.toHaveBeenCalled();
  });

  it("remembers that a failed refresh ended the session", async () => {
    api.defaults.adapter = (config) => Promise.reject(unauthorized(config));
    vi.spyOn(axios, "post").mockRejectedValue(new Error("401"));

    await expect(api.get("/auth/me")).rejects.toBeInstanceOf(AxiosError);

    expect(window.localStorage.getItem("overlab.session")).toBe("ended");
  });
});
