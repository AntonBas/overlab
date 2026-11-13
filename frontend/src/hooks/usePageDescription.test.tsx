import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { plainDescription, usePageDescription } from "./usePageDescription";

function addMeta(attribute: "name" | "property", key: string, content: string) {
  const meta = document.createElement("meta");
  meta.setAttribute(attribute, key);
  meta.setAttribute("content", content);
  document.head.appendChild(meta);
  return meta;
}

describe("plainDescription", () => {
  it("turns hero links into readable names", () => {
    expect(plainDescription("Pairs with [[hero/dva]] and [[hero/lucio]]")).toBe(
      "Pairs with dva and lucio",
    );
  });

  it("collapses whitespace and handles empty input", () => {
    expect(plainDescription("  a \n  b ")).toBe("a b");
    expect(plainDescription(null)).toBe("");
  });

  it("truncates long text to 160 characters", () => {
    const result = plainDescription("a".repeat(200));

    expect(result).toHaveLength(160);
    expect(result.endsWith("…")).toBe(true);
  });
});

describe("usePageDescription", () => {
  let description: HTMLMetaElement;

  beforeEach(() => {
    description = addMeta("name", "description", "default");
    addMeta("property", "og:description", "default");
    addMeta("property", "og:url", "default");
  });

  afterEach(() => {
    document.head.innerHTML = "";
  });

  it("sets the description and canonical link, then restores them", () => {
    const { unmount } = renderHook(() => usePageDescription("Custom text"));

    expect(description.getAttribute("content")).toBe("Custom text");
    expect(document.head.querySelector('link[rel="canonical"]')).not.toBeNull();

    unmount();

    expect(description.getAttribute("content")).toBe("default");
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it("does nothing without a description", () => {
    renderHook(() => usePageDescription(null));

    expect(description.getAttribute("content")).toBe("default");
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
  });
});
