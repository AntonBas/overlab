import clsx from "clsx";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CollectedAt } from "../../../components/ui/CollectedAt";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import type { GameQueue } from "../../../types/api";
import { formatDateTime, formatPercent } from "../../../utils/format";
import { fetchPatches } from "../../patches/api/patchesApi";
import { fetchHeroHistory } from "../../stats/api/statsApi";
import { DataFreshness } from "../../stats/components/DataFreshness";
import {
  HISTORY_PERIODS,
  periodRange,
  type HistoryPeriodId,
} from "../utils/chart";
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

function metricValue(metric: Metric, current: CurrentStats): number | null {
  if (metric === "win") {
    return current.winRate;
  }
  return metric === "pick" ? current.pickRate : current.banRate;
}

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
  title?: string;
  current?: CurrentStats | null;
  headerAction?: ReactNode;
  children?: ReactNode;
}

export function HeroHistorySection({
  slug,
  mapSlug,
  queue,
  title = "History",
  current = null,
  headerAction,
  children,
}: HeroHistorySectionProps) {
  const [periodId, setPeriodId] = useState<HistoryPeriodId>("30d");
  const [selectedMetric, setSelectedMetric] = useState<Metric>("win");
  const period = HISTORY_PERIODS.find((entry) => entry.id === periodId)!;
  const range = useMemo(() => periodRange(period.days), [period.days]);
  const history = useFetch(
    () =>
      fetchHeroHistory(slug, {
        queue,
        tier: "ALL",
        platform: "PC",
        region: "EUROPE",
        map: mapSlug,
        ...range,
      }),
    [slug, mapSlug, queue, range],
    { keepPrevious: true },
  );
  const patches = useFetch(fetchPatches, []);

  const metrics = METRICS.filter(
    (entry) => entry.id !== "ban" || queue === "COMPETITIVE",
  );
  const metric =
    metrics.find((entry) => entry.id === selectedMetric) ?? metrics[0];
  const points = history.data?.points ?? [];
  const series = points.flatMap((point) => {
    const value =
      metric.id === "win"
        ? point.winRate
        : metric.id === "pick"
          ? point.pickRate
          : point.banRate;
    return value === null
      ? []
      : [{ time: Date.parse(point.capturedAt), value }];
  });
  const markers = (patches.data ?? []).map((patch) => ({
    time: Date.parse(patch.releasedAt),
    label: `Patch ${patch.version}`,
  }));
  const enough = series.length >= 2;

  return (
    <section className="section" aria-labelledby="history-heading">
      <div className="section__heading">
        <h2 id="history-heading">{title}</h2>
        {headerAction}
      </div>
      {children}
      <div className="stat-switch">
        <div className="segmented" role="group" aria-label="Statistic">
          {metrics.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={clsx("segmented__item", {
                "segmented__item--active": entry.id === metric.id,
              })}
              aria-pressed={entry.id === metric.id}
              onClick={() => setSelectedMetric(entry.id)}
            >
              {entry.label}
              {current && metricValue(entry.id, current) !== null && (
                <strong className="segmented__value">
                  {formatPercent(metricValue(entry.id, current) ?? 0)}
                </strong>
              )}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Period">
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
          />
        </div>
      )}
      <p className="muted footnote">
        All ranks, PC, Europe.
        {current && (
          <>
            {" "}
            Checked <CollectedAt value={current.capturedAt} />.
          </>
        )}{" "}
        Dashed lines mark patch releases.{" "}
        {!mapSlug && (
          <>
            <DataFreshness
              queue={queue}
              tier="ALL"
              platform="PC"
              region="EUROPE"
            />{" "}
          </>
        )}
        <Link to="/changes">See what changed across all heroes</Link>.
      </p>
    </section>
  );
}
