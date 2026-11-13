import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useNoIndex } from "./useNoIndex";

describe("useNoIndex", () => {
  it("adds a robots meta tag and removes it on unmount", () => {
    const { unmount } = renderHook(() => useNoIndex());

    expect(
      document.head
        .querySelector('meta[name="robots"]')
        ?.getAttribute("content"),
    ).toBe("noindex, nofollow");

    unmount();

    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });
});
