import { act, renderHook, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it, vi } from "vitest";
import { useFetch } from "./useFetch";

describe("useFetch", () => {
  it("starts loading and then exposes the data", async () => {
    const { result } = renderHook(() =>
      useFetch(() => Promise.resolve("ready"), []),
    );

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe("ready");
    expect(result.current.error).toBeNull();
  });

  it("exposes a failure instead of throwing", async () => {
    const config = { headers: new AxiosHeaders() };
    const failure = new AxiosError("bad", "ERR", config, null, {
      status: 404,
      data: { message: "Hero not found" },
      statusText: "",
      headers: {},
      config,
    });

    const { result } = renderHook(() =>
      useFetch(() => Promise.reject(failure), []),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error?.status).toBe(404);
    expect(result.current.error?.message).toBe("Hero not found");
  });

  it("loads again when a dependency changes and ignores stale answers", async () => {
    const fetcher = vi.fn((id: string) =>
      id === "slow"
        ? new Promise<string>((resolve) =>
            setTimeout(() => resolve("slow"), 50),
          )
        : Promise.resolve(id),
    );

    const { result, rerender } = renderHook(
      ({ id }) => useFetch(() => fetcher(id), [id]),
      { initialProps: { id: "slow" } },
    );
    rerender({ id: "fast" });

    await waitFor(() => expect(result.current.data).toBe("fast"));
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(result.current.data).toBe("fast");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("fetches again on reload", async () => {
    const fetcher = vi.fn(() => Promise.resolve("value"));
    const { result } = renderHook(() => useFetch(fetcher, []));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.reload());

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
