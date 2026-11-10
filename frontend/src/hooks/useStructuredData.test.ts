import { describe, expect, it } from "vitest";
import { breadcrumbList, serializeStructuredData } from "./useStructuredData";

describe("breadcrumbList", () => {
  it("numbers the items and builds absolute urls", () => {
    const list = breadcrumbList(
      [
        { name: "Overlab", path: "/" },
        { name: "Heroes", path: "/heroes" },
      ],
      "https://example.com",
    );

    expect(list["@type"]).toBe("BreadcrumbList");
    expect(list.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Overlab",
        item: "https://example.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Heroes",
        item: "https://example.com/heroes",
      },
    ]);
  });
});

describe("serializeStructuredData", () => {
  it("escapes angle brackets so the data cannot close the script tag", () => {
    const json = serializeStructuredData({ name: "</script><b>" });

    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toEqual({ name: "</script><b>" });
  });
});
