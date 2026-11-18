import clsx from "clsx";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { DeltaValue } from "../../../components/ui/DeltaValue";
import { DATE_LOCALE, formatPercent } from "../../../utils/format";
import {
  buildChartGeometry,
  nearestDotIndex,
  type ChartPoint,
  type ChartSize,
} from "../utils/chart";

export interface ChartMarker {
  time: number;
  label: string;
  detail?: string | null;
  kind?: "patch" | "hotfix";
  parentLabel?: string | null;
}

interface LineChartProps {
  title: string;
  points: ChartPoint[];
  markers?: ChartMarker[];
  seasonAt?: (time: number) => number | null;
  tone: "win" | "pick" | "ban";
  controls?: ReactNode;
  subject?: string;
}

const BASE_SIZE: ChartSize = {
  width: 600,
  height: 180,
  padding: { top: 12, right: 12, bottom: 24, left: 44 },
};

const MIN_CHART_WIDTH = 240;

const dateFormat = new Intl.DateTimeFormat(DATE_LOCALE, {
  day: "numeric",
  month: "short",
});

const patchDayFormat = new Intl.DateTimeFormat(DATE_LOCALE, {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const fullDateFormat = new Intl.DateTimeFormat(DATE_LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(time: number): string {
  return dateFormat.format(new Date(time));
}

function formatPatchDay(time: number): string {
  return patchDayFormat.format(new Date(time));
}

const EDGE_SHARE = 18;

function tooltipClass(share: number): string {
  if (share < EDGE_SHARE) {
    return "chart__tooltip chart__tooltip--start";
  }
  return share > 100 - EDGE_SHARE
    ? "chart__tooltip chart__tooltip--end"
    : "chart__tooltip";
}

const NO_MARKERS: ChartMarker[] = [];

export function LineChart({
  title,
  points,
  markers = NO_MARKERS,
  seasonAt,
  tone,
  controls,
  subject,
}: LineChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotWidth, setPlotWidth] = useState(BASE_SIZE.width);

  useLayoutEffect(() => {
    const plot = plotRef.current;
    if (!plot) {
      return;
    }
    function measure() {
      const width = plot?.clientWidth ?? 0;
      if (width > 0) {
        setPlotWidth(Math.max(MIN_CHART_WIDTH, Math.round(width)));
      }
    }
    measure();
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(plot);
    return () => observer.disconnect();
  }, []);

  const dataKey = `${points.length}:${points[0]?.time}:${points[points.length - 1]?.time}`;

  const [selectionKey, setSelectionKey] = useState(dataKey);
  if (selectionKey !== dataKey) {
    setSelectionKey(dataKey);
    setActiveIndex(null);
    setPinned(false);
  }

  useEffect(() => {
    if (!pinned) {
      return;
    }
    function unpinOutside(event: Event) {
      if (!plotRef.current?.contains(event.target as Node)) {
        setActiveIndex(null);
        setPinned(false);
      }
    }
    document.addEventListener("pointerdown", unpinOutside);
    return () => document.removeEventListener("pointerdown", unpinOutside);
  }, [pinned]);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const size: ChartSize = { ...BASE_SIZE, width: plotWidth };
  const geometry = buildChartGeometry(points, size);
  if (!geometry) {
    return null;
  }
  const visibleMarkers = markers.filter(
    (marker) =>
      marker.time >= geometry.minTime && marker.time <= geometry.maxTime,
  );
  const first = points[0];
  const last = points[points.length - 1];
  const summary = `${title}: from ${formatPercent(first.value)} on ${formatDate(first.time)} to ${formatPercent(last.value)} on ${formatDate(last.time)}`;
  const bottom = size.height - size.padding.bottom;
  const active =
    activeIndex !== null && activeIndex < geometry.dots.length
      ? geometry.dots[activeIndex]
      : null;
  const previous =
    active && activeIndex !== null && activeIndex > 0
      ? geometry.dots[activeIndex - 1]
      : null;
  const activeShare = active ? (active.x / size.width) * 100 : 0;
  const activeSeason = active && seasonAt ? seasonAt(active.time) : null;
  const patchesAtActive = active
    ? visibleMarkers.filter(
        (marker) =>
          marker.time <= active.time &&
          (previous
            ? marker.time > previous.time
            : marker.time === active.time),
      )
    : [];

  const patchInEffect =
    active && patchesAtActive.length === 0
      ? markers
          .filter((marker) => marker.time <= active.time)
          .reduce<ChartMarker | null>(
            (latest, marker) =>
              latest === null || marker.time > latest.time ? marker : latest,
            null,
          )
      : null;

  function nearestIndexAt(event: PointerEvent<SVGSVGElement>) {
    const box = svgRef.current?.getBoundingClientRect();
    const scale = box && box.width > 0 ? size.width / box.width : 1;
    const x = (event.clientX - (box?.left ?? 0)) * scale;
    return nearestDotIndex(geometry!.dots, x);
  }

  function hoverAt(event: PointerEvent<SVGSVGElement>) {
    if (!pinned) {
      setActiveIndex(nearestIndexAt(event));
    }
  }

  function pinAt(event: PointerEvent<SVGSVGElement>) {
    const index = nearestIndexAt(event);
    if (pinned && index === activeIndex) {
      setActiveIndex(null);
      setPinned(false);
      return;
    }
    setActiveIndex(index);
    setPinned(true);
  }

  function clearSelection() {
    setActiveIndex(null);
    setPinned(false);
  }

  function clearHover() {
    if (!pinned) {
      setActiveIndex(null);
    }
  }

  async function copyActive() {
    if (!active) {
      return;
    }
    const label = subject ? `${subject} ${title}` : title;
    const text = `${fullDateFormat.format(new Date(active.time))}: ${formatPercent(active.value)} ${label}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function moveWithKeys(event: KeyboardEvent<SVGSVGElement>) {
    const lastIndex = geometry!.dots.length - 1;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, (index ?? lastIndex + 1) - 1));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(lastIndex, (index ?? -1) + 1));
    } else if (event.key === "Escape") {
      clearSelection();
    }
  }

  return (
    <figure className="chart">
      <figcaption className="chart__caption">
        <strong>{title}</strong>
        <div className="chart__controls">{controls}</div>
      </figcaption>
      <div ref={plotRef} className="chart__plot">
        <svg
          ref={svgRef}
          className={`chart__svg chart__svg--${tone}`}
          viewBox={`0 0 ${size.width} ${size.height}`}
          role="group"
          aria-roledescription="interactive line chart"
          aria-label={summary}
          tabIndex={0}
          onPointerMove={hoverAt}
          onPointerDown={pinAt}
          onPointerLeave={clearHover}
          onBlur={clearHover}
          onKeyDown={moveWithKeys}
        >
          <text
            x={size.padding.left - 6}
            y={size.padding.top + 4}
            textAnchor="end"
            className="chart__label"
          >
            {formatPercent(geometry.maxValue)}
          </text>
          <text
            x={size.padding.left - 6}
            y={bottom}
            textAnchor="end"
            className="chart__label"
          >
            {formatPercent(geometry.minValue)}
          </text>
          <line
            x1={size.padding.left}
            x2={size.width - size.padding.right}
            y1={bottom}
            y2={bottom}
            className="chart__axis"
          />
          <text
            x={size.padding.left}
            y={size.height - 6}
            className="chart__label"
          >
            {formatDate(geometry.minTime)}
          </text>
          <text
            x={size.width - size.padding.right}
            y={size.height - 6}
            textAnchor="end"
            className="chart__label"
          >
            {formatDate(geometry.maxTime)}
          </text>
          {visibleMarkers.map((marker) => {
            const x = geometry.xOf(marker.time);
            const isActive = patchesAtActive.includes(marker);
            return (
              <g key={`${marker.time}-${marker.label}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={size.padding.top}
                  y2={bottom}
                  className={clsx("chart__marker", {
                    "chart__marker--hotfix": marker.kind === "hotfix",
                    "chart__marker--active": isActive,
                  })}
                />
                <circle
                  cx={x}
                  cy={size.padding.top}
                  r={isActive ? 5 : 3.5}
                  className={clsx("chart__marker-dot", {
                    "chart__marker-dot--hotfix": marker.kind === "hotfix",
                  })}
                />
              </g>
            );
          })}
          <path d={geometry.path} className="chart__line" />
          {active && (
            <line
              x1={active.x}
              x2={active.x}
              y1={size.padding.top}
              y2={bottom}
              className="chart__guide"
            />
          )}
          {geometry.dots.map((dot, index) => (
            <circle
              key={dot.time}
              cx={dot.x}
              cy={dot.y}
              r={index === activeIndex ? 5 : 3}
              className={
                index === activeIndex
                  ? "chart__dot chart__dot--active"
                  : "chart__dot"
              }
            />
          ))}
        </svg>
        {active && (
          <div
            className={clsx(tooltipClass(activeShare), {
              "chart__tooltip--pinned": pinned,
            })}
            style={{
              left: `${activeShare}%`,
              top: `${(active.y / size.height) * 100}%`,
            }}
            aria-hidden={pinned ? undefined : "true"}
          >
            <div className="chart__tooltip-head">
              <span className="chart__tooltip-date">
                {fullDateFormat.format(new Date(active.time))}
              </span>
              {pinned && (
                <button
                  type="button"
                  className="button button--ghost button--compact chart__copy"
                  onClick={copyActive}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
            {activeSeason !== null && (
              <span className="chart__tooltip-season">
                Season {activeSeason}
              </span>
            )}
            <strong>{formatPercent(active.value)}</strong>
            {previous && (
              <span className="chart__tooltip-change">
                {Math.round((active.value - previous.value) * 10) === 0 ? (
                  <span className="muted">No change</span>
                ) : (
                  <>
                    <DeltaValue
                      value={active.value - previous.value}
                      title="Change since the previous point"
                    />{" "}
                    <span className="muted">vs previous</span>
                  </>
                )}
              </span>
            )}
            {patchInEffect && (
              <span className="chart__tooltip-effect">
                In effect: {patchInEffect.label} ·{" "}
                {formatPatchDay(patchInEffect.time)}
              </span>
            )}
            {patchesAtActive.map((marker) => (
              <span key={marker.time} className="chart__tooltip-patch">
                {marker.kind === "hotfix"
                  ? `Hotfix · ${formatPatchDay(marker.time)}`
                  : `Patch: ${marker.label} · ${formatPatchDay(marker.time)}`}
                {marker.kind === "hotfix" && marker.parentLabel && (
                  <span className="chart__tooltip-parent">
                    for {marker.parentLabel}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
        <span className="visually-hidden" role="status">
          {active
            ? `${fullDateFormat.format(new Date(active.time))}${activeSeason === null ? "" : `, season ${activeSeason}`}: ${formatPercent(active.value)}${patchesAtActive.map((marker) => `, patch ${marker.label}`).join("")}${patchInEffect ? `, in effect: ${patchInEffect.label}` : ""}`
            : ""}
        </span>
      </div>
      <table className="visually-hidden">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.time}>
              <th scope="row">{formatDate(point.time)}</th>
              <td>{formatPercent(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
