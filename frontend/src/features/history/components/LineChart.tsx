import clsx from "clsx";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { DeltaValue } from "../../../components/ui/DeltaValue";
import { formatPercent } from "../../../utils/format";
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
}

const SIZE: ChartSize = {
  width: 600,
  height: 180,
  padding: { top: 12, right: 12, bottom: 24, left: 44 },
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

const fullDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(time: number): string {
  return dateFormat.format(new Date(time));
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

export function LineChart({
  title,
  points,
  markers = [],
  seasonAt,
  tone,
}: LineChartProps) {
  const [asTable, setAsTable] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const geometry = buildChartGeometry(points, SIZE);
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
  const bottom = SIZE.height - SIZE.padding.bottom;
  const active =
    activeIndex !== null && activeIndex < geometry.dots.length
      ? geometry.dots[activeIndex]
      : null;
  const previous =
    active && activeIndex !== null && activeIndex > 0
      ? geometry.dots[activeIndex - 1]
      : null;
  const activeShare = active ? (active.x / SIZE.width) * 100 : 0;
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

  function selectAt(event: PointerEvent<SVGSVGElement>) {
    const box = svgRef.current?.getBoundingClientRect();
    const scale = box && box.width > 0 ? SIZE.width / box.width : 1;
    const x = (event.clientX - (box?.left ?? 0)) * scale;
    setActiveIndex(nearestDotIndex(geometry!.dots, x));
  }

  function clearSelection() {
    setActiveIndex(null);
  }

  function moveWithKeys(event: KeyboardEvent<SVGSVGElement>) {
    const last = geometry!.dots.length - 1;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, (index ?? last + 1) - 1));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(last, (index ?? -1) + 1));
    } else if (event.key === "Escape") {
      clearSelection();
    }
  }

  return (
    <figure className="chart">
      <figcaption className="chart__caption">
        <strong>{title}</strong>
        <button
          type="button"
          className="button button--ghost"
          aria-pressed={asTable}
          onClick={() => setAsTable((current) => !current)}
        >
          {asTable ? "Show chart" : "Show table"}
        </button>
      </figcaption>
      {asTable ? (
        <div className="table-wrap">
          <table className="table">
            <caption className="visually-hidden">{title}</caption>
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
        </div>
      ) : (
        <div className="chart__plot">
          <svg
            ref={svgRef}
            className={`chart__svg chart__svg--${tone}`}
            viewBox={`0 0 ${SIZE.width} ${SIZE.height}`}
            role="img"
            aria-label={summary}
            tabIndex={0}
            onPointerMove={selectAt}
            onPointerDown={selectAt}
            onPointerLeave={clearSelection}
            onBlur={clearSelection}
            onKeyDown={moveWithKeys}
          >
            <text
              x={SIZE.padding.left - 6}
              y={SIZE.padding.top + 4}
              textAnchor="end"
              className="chart__label"
            >
              {formatPercent(geometry.maxValue)}
            </text>
            <text
              x={SIZE.padding.left - 6}
              y={bottom}
              textAnchor="end"
              className="chart__label"
            >
              {formatPercent(geometry.minValue)}
            </text>
            <line
              x1={SIZE.padding.left}
              x2={SIZE.width - SIZE.padding.right}
              y1={bottom}
              y2={bottom}
              className="chart__axis"
            />
            <text
              x={SIZE.padding.left}
              y={SIZE.height - 6}
              className="chart__label"
            >
              {formatDate(geometry.minTime)}
            </text>
            <text
              x={SIZE.width - SIZE.padding.right}
              y={SIZE.height - 6}
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
                    y1={SIZE.padding.top}
                    y2={bottom}
                    className={clsx("chart__marker", {
                      "chart__marker--hotfix": marker.kind === "hotfix",
                      "chart__marker--active": isActive,
                    })}
                  />
                  <circle
                    cx={x}
                    cy={SIZE.padding.top}
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
                y1={SIZE.padding.top}
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
              className={tooltipClass(activeShare)}
              style={{
                left: `${activeShare}%`,
                top: `${(active.y / SIZE.height) * 100}%`,
              }}
              aria-hidden="true"
            >
              <span className="chart__tooltip-date">
                {fullDateFormat.format(new Date(active.time))}
              </span>
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
              {patchesAtActive.map((marker) => (
                <span key={marker.time} className="chart__tooltip-patch">
                  {marker.kind === "hotfix"
                    ? `Hotfix · ${formatDate(marker.time)}`
                    : `Patch: ${marker.label} · ${formatDate(marker.time)}`}
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
              ? `${fullDateFormat.format(new Date(active.time))}${activeSeason === null ? "" : `, season ${activeSeason}`}: ${formatPercent(active.value)}${patchesAtActive.map((marker) => `, patch ${marker.label}`).join("")}`
              : ""}
          </span>
        </div>
      )}
    </figure>
  );
}
