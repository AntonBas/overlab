import clsx from "clsx";
import { useMemo, useState, type ReactNode } from "react";
import { CollectedAt } from "../../../components/ui/CollectedAt";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import type { GameQueue, Region } from "../../../types/common";
import type { HeroHistoryPoint } from "../../../types/stats";
import {
  REGION_LABELS,
  formatDateTime,
  formatPercent,
} from "../../../utils/format";
import { fetchPatches } from "../../patches";
import { fetchHeroHistory } from "../../stats";
import { DataFreshness } from "../../stats";
import {
  HISTORY_PERIODS,
  periodRange,
  type HistoryPeriodId,
} from "../utils/chart";
import { buildPatchMarkers, buildSeasonLookup } from "../utils/patchMarkers";
import { LineChart } from "./LineChart";

type Metric = "win" | "pick" | "ban";

interface MetricDefinition {
  id: Metric;
  label: string;
  tone: "win" | "pick" | "ban";
}

const METRICS: MetricDefinition[] = [
  { id: "win", label: "Win rate", tone: "win" },
  { id: "pick", label: "Pick rate", tone: "pick" },
  { id: "ban", label: "Ban rate", tone: "ban" },
];

function metricValue(point: HeroHistoryPoint, metric: Metric): number | null {
  if (metric === "win") {
    return point.winRate;
  }
  return metric === "pick" ? point.pickRate : point.banRate;
}

function summarize(points: HeroHistoryPoint[], metric: Metric) {
  const values = points.flatMap((point) => {
    const value = metricValue(point, metric);
    return value === null ? [] : [value];
  });
  if (values.length === 0) {
    return { latest: null, change: null };
  }
  const latest = values[values.length - 1];
  return {
    latest,
    change: values.length > 1 ? latest - values[0] : null,
  };
}

function changeTone(metric: Metric, change: number): "up" | "down" | "flat" {
  if (Math.round(change * 10) === 0) {
    return "flat";
  }
  const increased = change > 0;
  return increased === (metric !== "ban") ? "up" : "down";
}

const DEFAULT_PERIOD_ID: HistoryPeriodId = "30d";

export interface CurrentStats {
  winRate: number;
  pickRate: number;
  banRate: number | null;
  capturedAt: string;
}

interface HeroHistorySectionProps {
  slug: string;
  mapSlug?: string;
  queue: GameQueue;
  region: Region;
  title?: string;
  current?: CurrentStats | null;
  headerAction?: ReactNode;
  children?: ReactNode;
}

export function HeroHistorySection({
  slug,
  mapSlug,
  queue,
  region,
  title = "History",
  current = null,
  headerAction,
  children,
}: HeroHistorySectionProps) {
  const [periodId, setPeriodId] = useState<HistoryPeriodId>(DEFAULT_PERIOD_ID);
  const [selectedMetric, setSelectedMetric] = useState<Metric>("win");
  const period = HISTORY_PERIODS.find((entry) => entry.id === periodId)!;
  const range = useMemo(() => periodRange(period.days), [period.days]);
  const history = useFetch(
    () =>
      fetchHeroHistory(slug, {
        queue,
        tier: "ALL",
        platform: "PC",
        region,
        map: mapSlug,
        ...range,
      }),
    [slug, mapSlug, queue, region, range],
    { keepPrevious: true },
  );
  const patches = useFetch(fetchPatches, []);

  const isAvailable = (entry: MetricDefinition) =>
    entry.id !== "ban" || queue === "COMPETITIVE";
  const metric =
    METRICS.find(
      (entry) => entry.id === selectedMetric && isAvailable(entry),
    ) ?? METRICS[0];
  const points = history.data?.points ?? [];
  const series = points.flatMap((point) => {
    const value = metricValue(point, metric.id);
    return value === null
      ? []
      : [{ time: Date.parse(point.capturedAt), value }];
  });
  const markers = buildPatchMarkers(patches.data ?? []);
  const seasonAt = buildSeasonLookup(patches.data ?? []);
  const enough = series.length >= 2;

  return (
    <section className="section" aria-labelledby="history-heading">
      <div className="section__heading">
        <h2 id="history-heading">{title}</h2>
        {headerAction}
      </div>
      {children}
      <div className="stat-switch">
        <div className="kpi-row" role="group" aria-label="Statistic">
          {METRICS.map((entry) => {
            const summary = summarize(points, entry.id);
            const available = isAvailable(entry);
            return (
              <button
                key={entry.id}
                type="button"
                disabled={!available}
                title={
                  available
                    ? undefined
                    : `${entry.label} is only tracked in Competitive`
                }
                className={clsx("kpi", `kpi--${entry.tone}`, {
                  "kpi--active": entry.id === metric.id,
                })}
                aria-pressed={entry.id === metric.id}
                onClick={() => setSelectedMetric(entry.id)}
              >
                <span className="kpi__label">{entry.label}</span>
                <span className="kpi__value">
                  {formatPercent(available ? summary.latest : null)}
                  {available && summary.change !== null && (
                    <span
                      className={clsx(
                        "kpi__change",
                        `kpi__change--${changeTone(entry.id, summary.change)}`,
                      )}
                    >
                      {summary.change > 0 ? "▲" : summary.change < 0 ? "▼" : ""}{" "}
                      {Math.abs(summary.change).toFixed(1)}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div
          className="segmented segmented--quiet"
          role="group"
          aria-label="Period"
        >
          {HISTORY_PERIODS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={clsx("segmented__item", {
                "segmented__item--active": entry.id === periodId,
              })}
              aria-pressed={entry.id === periodId}
              onClick={() => setPeriodId(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>
      {history.loading && <Spinner label="Loading history" />}
      {history.error && (
        <ErrorMessage failure={history.error} onRetry={history.reload} />
      )}
      {history.data && !enough && (
        <EmptyState>
          Not enough data for a chart yet.
          {points.length === 1
            ? ` Statistics have been collected since ${formatDateTime(points[0].capturedAt)}.`
            : " Statistics are collected daily, so history appears over time."}
        </EmptyState>
      )}
      {history.data && enough && (
        <div
          className={history.stale ? "is-stale" : undefined}
          aria-busy={history.stale}
        >
          <LineChart
            title={metric.label}
            tone={metric.tone}
            points={series}
            markers={markers}
            seasonAt={seasonAt}
          />
        </div>
      )}
      <p className="muted footnote">
        All ranks, PC, {REGION_LABELS[region]}.
        {current && (
          <>
            {" "}
            Checked <CollectedAt value={current.capturedAt} />.
          </>
        )}{" "}
        Dashed lines mark patch releases, hollow dots mark hotfixes.
        {!mapSlug && (
          <>
            {" "}
            <DataFreshness
              queue={queue}
              tier="ALL"
              platform="PC"
              region={region}
            />
          </>
        )}
      </p>
    </section>
  );
}
