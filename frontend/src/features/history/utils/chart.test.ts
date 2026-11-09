import { describe, expect, it } from "vitest";
import { buildChartGeometry, periodRange } from "./chart";

const size = {
  width: 100,
  height: 50,
  padding: { top: 5, right: 5, bottom: 5, left: 5 },
};

describe("buildChartGeometry", () => {
  it("returns null when there is nothing to draw", () => {
    expect(buildChartGeometry([], size)).toBeNull();
  });

  it("maps the earliest point to the left edge and the latest to the right edge", () => {
    const geometry = buildChartGeometry(
      [
        { time: 0, value: 40 },
        { time: 10, value: 50 },
      ],
      size,
    );
    expect(geometry?.dots[0].x).toBe(5);
    expect(geometry?.dots[1].x).toBe(95);
  });

  it("draws higher values higher up", () => {
    const geometry = buildChartGeometry(
      [
        { time: 0, value: 40 },
        { time: 10, value: 50 },
      ],
      size,
    );
    expect(geometry!.dots[1].y).toBeLessThan(geometry!.dots[0].y);
    expect(geometry!.path.startsWith("M")).toBe(true);
  });

  it("centres a single point and keeps a flat series inside the chart", () => {
    const single = buildChartGeometry([{ time: 5, value: 50 }], size);
    expect(single?.dots[0].x).toBe(50);

    const flat = buildChartGeometry(
      [
        { time: 0, value: 50 },
        { time: 1, value: 50 },
      ],
      size,
    );
    expect(flat?.dots[0].y).toBeGreaterThan(5);
    expect(flat?.dots[0].y).toBeLessThan(45);
  });
});

describe("periodRange", () => {
  it("covers the requested number of days ending now", () => {
    const range = periodRange(7, new Date("2026-10-25T10:30:00Z"));
    expect(range.to).toBe("2026-10-25T10:00:00.000Z");
    expect(range.from).toBe("2026-10-18T10:00:00.000Z");
  });
});
