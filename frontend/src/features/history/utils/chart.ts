export interface ChartPoint {
  time: number;
  value: number;
}

export interface ChartGeometry {
  path: string;
  dots: { x: number; y: number; time: number; value: number }[];
  minValue: number;
  maxValue: number;
  minTime: number;
  maxTime: number;
  xOf: (time: number) => number;
}

export interface ChartSize {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
}

export function buildChartGeometry(
  points: ChartPoint[],
  size: ChartSize,
): ChartGeometry | null {
  if (points.length === 0) {
    return null;
  }
  const times = points.map((point) => point.time);
  const values = points.map((point) => point.value);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const margin = rawMax === rawMin ? 0.5 : (rawMax - rawMin) * 0.1;
  const minValue = rawMin - margin;
  const maxValue = rawMax + margin;

  const innerWidth = size.width - size.padding.left - size.padding.right;
  const innerHeight = size.height - size.padding.top - size.padding.bottom;
  const xOf = (time: number) =>
    maxTime === minTime
      ? size.padding.left + innerWidth / 2
      : size.padding.left +
        ((time - minTime) / (maxTime - minTime)) * innerWidth;
  const yOf = (value: number) =>
    size.padding.top +
    (1 - (value - minValue) / (maxValue - minValue)) * innerHeight;

  const dots = points.map((point) => ({
    x: xOf(point.time),
    y: yOf(point.value),
    time: point.time,
    value: point.value,
  }));
  const path = dots
    .map(
      (dot, index) =>
        `${index === 0 ? "M" : "L"}${dot.x.toFixed(1)} ${dot.y.toFixed(1)}`,
    )
    .join(" ");

  return { path, dots, minValue, maxValue, minTime, maxTime, xOf };
}

export const HISTORY_PERIODS = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
  { id: "365d", label: "Year", days: 365 },
] as const;

export type HistoryPeriodId = (typeof HISTORY_PERIODS)[number]["id"];

export function periodRange(
  days: number,
  now: Date = new Date(),
): { from: string; to: string } {
  const to = new Date(now);
  to.setUTCMinutes(0, 0, 0);
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}
