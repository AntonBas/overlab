import { act, renderHook, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
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

  it("keeps the previous result while the next one loads when asked to", async () => {
    let release: (value: string) => void = () => undefined;
    const fetcher = (id: string) =>
      id === "first"
        ? Promise.resolve("first result")
        : new Promise<string>((resolve) => {
            release = resolve;
          });

    const { result, rerender } = renderHook(
      ({ id }) => useFetch(() => fetcher(id), [id], { keepPrevious: true }),
      { initialProps: { id: "first" } },
    );
    await waitFor(() => expect(result.current.data).toBe("first result"));

    rerender({ id: "second" });
    expect(result.current.data).toBe("first result");
    expect(result.current.loading).toBe(false);
    expect(result.current.stale).toBe(true);

    await act(async () => release("second result"));
    await waitFor(() => expect(result.current.data).toBe("second result"));
    expect(result.current.stale).toBe(false);
  });

  describe("spinner timing", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows data immediately when the answer is fast", async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() =>
        useFetch(() => Promise.resolve("fast"), []),
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe("fast");
    });

    it("keeps the spinner for a minimum time once it became visible", async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() =>
        useFetch(
          () =>
            new Promise<string>((resolve) => {
              setTimeout(() => resolve("late"), 250);
            }),
          [],
        ),
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(result.current.loading).toBe(true);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe("late");
    });
  });
});
