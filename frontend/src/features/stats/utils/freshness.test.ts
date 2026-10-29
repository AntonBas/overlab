import { describe, expect, it } from "vitest";
import { describeFreshness } from "./freshness";

describe("describeFreshness", () => {
  it("names the day the current numbers first appeared", () => {
    expect(
      describeFreshness({
        capturedAt: "2026-10-29T10:00:00Z",
        lastCheckedAt: "2026-10-29T10:00:00Z",
        valuesSince: "2026-10-28T17:04:00Z",
        snapshotCount: 4,
        changeObserved: true,
      }),
    ).toBe("Blizzard last changed these numbers on 28 Oct 2026.");
  });

  it("says nothing changed since the first collection", () => {
    expect(
      describeFreshness({
        capturedAt: "2026-10-29T10:00:00Z",
        lastCheckedAt: "2026-10-29T10:00:00Z",
        valuesSince: "2026-10-28T17:04:00Z",
        snapshotCount: 4,
        changeObserved: false,
      }),
    ).toBe(
      "Blizzard has not changed these numbers since we started collecting on 28 Oct 2026.",
    );
  });

  it("has nothing to say with a single snapshot", () => {
    expect(
      describeFreshness({
        capturedAt: "2026-10-29T10:00:00Z",
        lastCheckedAt: "2026-10-29T10:00:00Z",
        valuesSince: "2026-10-29T10:00:00Z",
        snapshotCount: 1,
        changeObserved: false,
      }),
    ).toBeNull();
  });
});
