import { useState } from "react";
import { formatPercent } from "../../../utils/format";
import {
  buildChartGeometry,
  type ChartPoint,
  type ChartSize,
} from "../utils/chart";

export interface ChartMarker {
  time: number;
  label: string;
}

interface LineChartProps {
  title: string;
  points: ChartPoint[];
  markers?: ChartMarker[];
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

function formatDate(time: number): string {
  return dateFormat.format(new Date(time));
}

export function LineChart({
  title,
  points,
  markers = [],
  tone,
}: LineChartProps) {
  const [asTable, setAsTable] = useState(false);
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
        <svg
          className={`chart__svg chart__svg--${tone}`}
          viewBox={`0 0 ${SIZE.width} ${SIZE.height}`}
          role="img"
          aria-label={summary}
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
            return (
              <g key={`${marker.time}-${marker.label}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={SIZE.padding.top}
                  y2={bottom}
                  className="chart__marker"
                />
                <title>{marker.label}</title>
              </g>
            );
          })}
          <path d={geometry.path} className="chart__line" />
          {geometry.dots.map((dot) => (
            <circle
              key={dot.time}
              cx={dot.x}
              cy={dot.y}
              r={3}
              className="chart__dot"
            >
              <title>{`${formatDate(dot.time)}: ${formatPercent(dot.value)}`}</title>
            </circle>
          ))}
        </svg>
      )}
    </figure>
  );
}
