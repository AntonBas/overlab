import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { QueueToggle } from "../../../components/ui/QueueToggle";
import { TableSkeleton } from "../../../components/ui/TableSkeleton";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import type { GameQueue } from "../../../types/api";
import { formatDateTime } from "../../../utils/format";
import { fetchHeroes } from "../../heroes/api/heroesApi";
import { fetchPatches } from "../../patches/api/patchesApi";
import { fetchComparison } from "../../stats/api/statsApi";
import { ChangesTable } from "../components/ChangesTable";
import { periodRange } from "../utils/chart";

const PERIODS: Record<string, { label: string; days: number }> = {
  "7d": { label: "Last 7 days", days: 7 },
  "30d": { label: "Last 30 days", days: 30 },
};

const PATCH_PREFIX = "patch:";

export function ChangesPage() {
  usePageTitle("What changed");
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") ?? "7d";
  const queue: GameQueue =
    searchParams.get("queue")?.toUpperCase() === "QUICK_PLAY"
      ? "QUICK_PLAY"
      : "COMPETITIVE";
  const patches = useFetch(fetchPatches, []);

  const range = useMemo(
    () => (PERIODS[view] ? periodRange(PERIODS[view].days) : null),
    [view],
  );
  const comparison = useFetch(
    () =>
      fetchComparison({
        queue,
        tier: "ALL",
        platform: "PC",
        region: "EUROPE",
        ...(view.startsWith(PATCH_PREFIX)
          ? { patch: view.slice(PATCH_PREFIX.length) }
          : (range ?? {})),
      }),
    [queue, view, range],
    { keepPrevious: true },
  );
  const heroes = useFetch(fetchHeroes, []);
  const portraits = Object.fromEntries(
    (heroes.data ?? []).map((hero) => [hero.slug, hero.portraitUrl]),
  );
  const activePatch = view.startsWith(PATCH_PREFIX)
    ? (patches.data ?? []).find(
        (patch) => patch.slug === view.slice(PATCH_PREFIX.length),
      )
    : undefined;

  function update(next: { view?: string; queue?: GameQueue }) {
    const params = new URLSearchParams();
    const nextView = next.view ?? view;
    const nextQueue = next.queue ?? queue;
    if (nextView !== "7d") {
      params.set("view", nextView);
    }
    if (nextQueue === "QUICK_PLAY") {
      params.set("queue", "quick_play");
    }
    setSearchParams(params);
  }

  return (
    <>
      <PageHeader
        title="What changed"
        subtitle="Which heroes gained or lost win rate and pick rate between two snapshots"
        actions={
          <QueueToggle
            value={queue}
            onChange={(next) => update({ queue: next })}
          />
        }
      />
      <label className="field field--inline">
        <span className="field__label">Compare</span>
        <select
          value={view}
          onChange={(event) => update({ view: event.target.value })}
        >
          {Object.entries(PERIODS).map(([id, period]) => (
            <option key={id} value={id}>
              {period.label}
            </option>
          ))}
          {(patches.data ?? []).map((patch) => (
            <option key={patch.id} value={`${PATCH_PREFIX}${patch.slug}`}>
              Patch {patch.version}
            </option>
          ))}
        </select>
      </label>
      {activePatch && (
        <p className="muted footnote">
          Patch {activePatch.version}
          {activePatch.title ? `: ${activePatch.title}` : ""}, released{" "}
          {formatDateTime(activePatch.releasedAt)}.
        </p>
      )}
      {comparison.loading && <TableSkeleton label="Loading comparison" />}
      {comparison.error &&
        (comparison.error.status === 404 ? (
          <EmptyState>
            Not enough history yet for this comparison. Statistics are collected
            daily, so more comparisons become available over time.
          </EmptyState>
        ) : (
          <ErrorMessage
            failure={comparison.error}
            onRetry={comparison.reload}
          />
        ))}
      {comparison.data && (
        <div
          className={comparison.stale ? "is-stale" : undefined}
          aria-busy={comparison.stale}
        >
          <p className="muted footnote" role="status">
            {comparison.data.beforeCapturedAt ===
            comparison.data.afterCapturedAt
              ? `Only one snapshot is available so far (${formatDateTime(comparison.data.afterCapturedAt)}), so nothing has changed yet.`
              : `Snapshot from ${formatDateTime(comparison.data.beforeCapturedAt)} compared with ${formatDateTime(comparison.data.afterCapturedAt)}. All ranks, PC, Europe.`}
          </p>
          <ChangesTable
            changes={comparison.data.heroes}
            showBan={queue === "COMPETITIVE"}
            portraits={portraits}
          />
        </div>
      )}
    </>
  );
}
