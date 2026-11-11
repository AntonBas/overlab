import { describe, expect, it } from "vitest";
import { regionForTimeZone } from "./region";

describe("regionForTimeZone", () => {
  it.each([
    ["Europe/Kyiv", "EUROPE"],
    ["Europe/London", "EUROPE"],
    ["Africa/Cairo", "EUROPE"],
    ["Asia/Dubai", "EUROPE"],
    ["Asia/Yekaterinburg", "EUROPE"],
    ["Asia/Seoul", "ASIA"],
    ["Asia/Tokyo", "ASIA"],
    ["Asia/Taipei", "ASIA"],
    ["Asia/Singapore", "ASIA"],
    ["Asia/Kolkata", "ASIA"],
    ["Pacific/Guam", "ASIA"],
    ["America/New_York", "AMERICAS"],
    ["America/Sao_Paulo", "AMERICAS"],
    ["Australia/Sydney", "AMERICAS"],
    ["Pacific/Auckland", "AMERICAS"],
  ] as const)("maps %s to %s", (timeZone, region) => {
    expect(regionForTimeZone(timeZone)).toBe(region);
  });

  it("falls back to Europe without a time zone", () => {
    expect(regionForTimeZone(undefined)).toBe("EUROPE");
    expect(regionForTimeZone("")).toBe("EUROPE");
  });
});
