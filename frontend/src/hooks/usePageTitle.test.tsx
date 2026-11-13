import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { usePageTitle } from "./usePageTitle";

describe("usePageTitle", () => {
  afterEach(() => {
    document.head.querySelector('meta[property="og:title"]')?.remove();
  });

  it("appends the site name to the title", () => {
    renderHook(() => usePageTitle("Heroes"));

    expect(document.title).toBe("Heroes | Overlab");
  });

  it("falls back to the site name without a title", () => {
    renderHook(() => usePageTitle(null));

    expect(document.title).toBe("Overlab");
  });

  it("updates the open graph title", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("property", "og:title");
    document.head.appendChild(meta);

    renderHook(() => usePageTitle("Maps"));

    expect(meta.getAttribute("content")).toBe("Maps | Overlab");
  });
});
