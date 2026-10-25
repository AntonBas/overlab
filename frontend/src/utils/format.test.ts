import { describe, expect, it } from "vitest";
import { formatDelta, formatPercent, formatSeconds } from "./format";

describe("formatPercent", () => {
  it("shows one decimal and a percent sign", () => {
    expect(formatPercent(47.1)).toBe("47.1%");
    expect(formatPercent(50)).toBe("50.0%");
  });

  it("shows a dash when the value is missing", () => {
    expect(formatPercent(null)).toBe("-");
    expect(formatPercent(undefined)).toBe("-");
  });
});

describe("formatDelta", () => {
  it("prefixes positive values with a plus sign", () => {
    expect(formatDelta(1.24)).toBe("+1.2");
  });

  it("uses a real minus sign for negative values", () => {
    expect(formatDelta(-0.96)).toBe("−1.0");
  });

  it("shows zero without a sign and nothing for a missing value", () => {
    expect(formatDelta(0)).toBe("0.0");
    expect(formatDelta(0.04)).toBe("0.0");
    expect(formatDelta(null)).toBe("");
  });
});

describe("formatSeconds", () => {
  it("formats minutes and padded seconds", () => {
    expect(formatSeconds(83)).toBe("1:23");
    expect(formatSeconds(5)).toBe("0:05");
    expect(formatSeconds(600)).toBe("10:00");
  });
});
