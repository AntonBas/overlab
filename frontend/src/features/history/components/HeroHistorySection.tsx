import clsx from "clsx";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import type { GameQueue } from "../../../types/api";
import { formatDateTime } from "../../../utils/format";
import { fetchPatches } from "../../patches/api/patchesApi";
import { fetchHeroHistory } from "../../stats/api/statsApi";
import {
  HISTORY_PERIODS,
  periodRange,
  type HistoryPeriodId,
} from "../utils/chart";
import { LineChart } from "./LineChart";

interface HeroHistorySectionProps {
  slug: string;
  queue: GameQueue;
}

export function HeroHistorySection({ slug, queue }: HeroHistorySectionProps) {
  const [periodId, setPeriodId] = useState<HistoryPeriodId>("30d");
  const period = HISTORY_PERIODS.find((entry) => entry.id === periodId)!;
  const range = useMemo(() => periodRange(period.days), [period.days]);
  const history = useFetch(
    () =>
      fetchHeroHistory(slug, {
        queue,
        tier: "ALL",
        platform: "PC",
        region: "EUROPE",
        ...range,
      }),
    [slug, queue, range],
    { keepPrevious: true },
  );
  const patches = useFetch(fetchPatches, []);

  const points = history.data?.points ?? [];
  const toSeries = (pick: (point: (typeof points)[number]) => number | null) =>
    points.flatMap((point) => {
      const value = pick(point);
      return value === null
        ? []
        : [{ time: Date.parse(point.capturedAt), value }];
    });
  const markers = (patches.data ?? []).map((patch) => ({
    time: Date.parse(patch.releasedAt),
    label: `Patch ${patch.version}`,
  }));
  const enough = points.length >= 2;

  return (
    <section className="section" aria-labelledby="history-heading">
      <h2 id="history-heading">History</h2>
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
            title="Win rate"
            tone="win"
            points={toSeries((point) => point.winRate)}
            markers={markers}
          />
          <LineChart
            title="Pick rate"
            tone="pick"
            points={toSeries((point) => point.pickRate)}
            markers={markers}
          />
          {queue === "COMPETITIVE" &&
            toSeries((point) => point.banRate).length >= 2 && (
              <LineChart
                title="Ban rate"
                tone="ban"
                points={toSeries((point) => point.banRate)}
                markers={markers}
              />
            )}
          <p className="muted footnote">
            All ranks, PC, Europe. Dashed lines mark patch releases.{" "}
            <Link to="/changes">See what changed across all heroes</Link>.
          </p>
        </div>
      )}
    </section>
  );
}
