import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useResettingPage } from "./useResettingPage";

describe("useResettingPage", () => {
  it("keeps the page while the key is unchanged", () => {
    const { result } = renderHook(({ key }) => useResettingPage(key), {
      initialProps: { key: "a" },
    });
    act(() => result.current[1](3));
    expect(result.current[0]).toBe(3);
  });

  it("returns to the first page in the same render when the key changes", () => {
    const { result, rerender } = renderHook(
      ({ key }) => useResettingPage(key),
      { initialProps: { key: "a" } },
    );
    act(() => result.current[1](3));
    rerender({ key: "b" });
    expect(result.current[0]).toBe(0);
  });
});
