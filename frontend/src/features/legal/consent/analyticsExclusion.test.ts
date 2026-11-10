import { describe, expect, it } from "vitest";
import { isExcludedFromAnalytics } from "./analyticsExclusion";

describe("isExcludedFromAnalytics", () => {
  it("excludes the admin panel and its pages", () => {
    expect(isExcludedFromAnalytics("/admin")).toBe(true);
    expect(isExcludedFromAnalytics("/admin/collector")).toBe(true);
    expect(isExcludedFromAnalytics("/admin/users?page=2")).toBe(true);
    expect(isExcludedFromAnalytics("https://overlabgg.com/admin/audit")).toBe(
      true,
    );
  });

  it("keeps public pages and lookalike paths", () => {
    expect(isExcludedFromAnalytics("/stats")).toBe(false);
    expect(isExcludedFromAnalytics("/heroes/admin")).toBe(false);
    expect(isExcludedFromAnalytics("/administration")).toBe(false);
    expect(isExcludedFromAnalytics(undefined)).toBe(false);
  });
});
