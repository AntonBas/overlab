import { describe, expect, it } from "vitest";
import { describeCron, describeInterval } from "./cron";

describe("describeCron", () => {
  it("describes a daily schedule", () => {
    expect(describeCron("0 0 4 * * *")).toBe("Every day at 04:00");
  });

  it("describes a weekly schedule with a weekday name", () => {
    expect(describeCron("0 30 4 * * MON")).toBe("Every Monday at 04:30");
  });

  it("describes a weekly schedule with a weekday number", () => {
    expect(describeCron("0 15 5 * * 0")).toBe("Every Sunday at 05:15");
  });

  it("accepts a five field expression", () => {
    expect(describeCron("45 5 * * MON")).toBe("Every Monday at 05:45");
  });

  it("returns null for schedules it cannot describe", () => {
    expect(describeCron("0 */5 * * * *")).toBeNull();
    expect(describeCron("not a cron")).toBeNull();
  });
});

describe("describeInterval", () => {
  it("describes whole days", () => {
    expect(describeInterval("PT48H")).toBe("2 days");
    expect(describeInterval("PT168H")).toBe("7 days");
  });

  it("describes minutes instead of fractions of an hour", () => {
    expect(describeInterval("PT1M")).toBe("minute");
    expect(describeInterval("PT15M")).toBe("15 minutes");
    expect(describeInterval("PT90M")).toBe("90 minutes");
  });

  it("describes hours", () => {
    expect(describeInterval("PT6H")).toBe("6 hours");
  });
});
