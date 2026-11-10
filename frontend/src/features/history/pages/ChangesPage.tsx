import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import {
  IconSelect,
  type IconSelectOption,
} from "../../../components/ui/IconSelect";
import { PageHeader } from "../../../components/ui/PageHeader";
import { QueueToggle } from "../../../components/ui/QueueToggle";
import { TableSkeleton } from "../../../components/ui/TableSkeleton";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import {
  breadcrumbList,
  useStructuredData,
} from "../../../hooks/useStructuredData";
import { usePageDescription } from "../../../hooks/usePageDescription";
import type { Patch } from "../../../types/api";
import { formatDate, formatDateTime } from "../../../utils/format";
import { matchesName } from "../../../utils/search";
import { fetchHeroes } from "../../heroes/api/heroesApi";
import { fetchPatches } from "../../patches/api/patchesApi";
import { fetchComparison, fetchHistoryStart } from "../../stats/api/statsApi";
import { StatsFilters } from "../../stats/components/StatsFilters";
import { isQuickPlay, toSearchParams } from "../../stats/filters";
import { useFilterState } from "../../stats/hooks/useFilterState";
import { ChangesTable } from "../components/ChangesTable";
import { periodRange } from "../utils/chart";

const PERIODS: Record<string, { label: string; days: number }> = {
  "7d": { label: "Last 7 days", days: 7 },
  "30d": { label: "Last 30 days", days: 30 },
  "90d": { label: "Last 3 months", days: 90 },
  "180d": { label: "Last 6 months", days: 180 },
  "365d": { label: "Last year", days: 365 },
};

const PATCH_PREFIX = "patch:";
const DEFAULT_VIEW = "7d";
const OTHER_SEASON = "other";
const RECENT_SEASONS = 2;
const RECENT_SELECTION = "recent";
const PRESERVED_PARAMS = ["view", "season"];

interface PatchGroup {
  key: string;
  label: string;
  season: number | null;
  patches: Patch[];
}

function seasonKey(patch: Patch): string {
  return patch.season === null ? OTHER_SEASON : String(patch.season);
}

function groupBySeason(patches: Patch[]): PatchGroup[] {
  const groups: PatchGroup[] = [];
  for (const patch of patches) {
    const key = seasonKey(patch);
    const existing = groups.find((group) => group.key === key);
    if (existing) {
      existing.patches.push(patch);
    } else {
      groups.push({
        key,
        label:
          patch.season === null ? "Other patches" : `Season ${patch.season}`,
        season: patch.season,
        patches: [patch],
      });
    }
  }
  return groups;
}

function recentGroupKeys(groups: PatchGroup[]): string[] {
  const numbered = groups
    .filter((group) => group.season !== null)
    .sort((first, second) => (second.season ?? 0) - (first.season ?? 0));
  const recent = numbered.length === 0 ? groups : numbered;
  return recent.slice(0, RECENT_SEASONS).map((group) => group.key);
}

function patchLabel(patch: Patch): string {
  return `${patch.title ?? `Patch ${patch.version}`} · ${formatDate(patch.releasedAt)}`;
}

export function ChangesPage() {
  usePageTitle("Overwatch 2 hero win rate changes by patch");
  usePageDescription(
    "See which Overwatch 2 heroes gained or lost win and pick rate between patches and over the last weeks.",
  );
  useStructuredData(
    breadcrumbList(
      [
        { name: "Overlab", path: "/" },
        { name: "What changed", path: "/changes" },
      ],
      window.location.origin,
    ),
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") ?? DEFAULT_VIEW;
  const { filters, update: updateFilters } = useFilterState(
    undefined,
    PRESERVED_PARAMS,
  );
  const [search, setSearch] = useState("");
  const patches = useFetch(fetchPatches, []);

  const range = useMemo(
    () => (PERIODS[view] ? periodRange(PERIODS[view].days) : null),
    [view],
  );
  const comparison = useFetch(
    () =>
      fetchComparison({
        queue: filters.queue,
        tier: filters.tier,
        platform: filters.platform,
        region: filters.region,
        ...(view.startsWith(PATCH_PREFIX)
          ? { patch: view.slice(PATCH_PREFIX.length) }
          : (range ?? {})),
      }),
    [
      filters.queue,
      filters.tier,
      filters.platform,
      filters.region,
      filters.map,
      view,
      range,
    ],
    { keepPrevious: true },
  );
  const historyStart = useFetch(
    () =>
      fetchHistoryStart(
        filters.queue,
        filters.tier,
        filters.platform,
        filters.region,
      ),
    [filters.queue, filters.tier, filters.platform, filters.region],
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

  const firstCapturedAt = historyStart.data?.firstCapturedAt ?? null;
  const comparablePatches = (patches.data ?? []).filter(
    (patch) =>
      patch.slug === activePatch?.slug ||
      firstCapturedAt === null ||
      new Date(patch.releasedAt) >= new Date(firstCapturedAt),
  );

  const availablePeriods = Object.entries(PERIODS).filter(
    ([id, period]) =>
      id === DEFAULT_VIEW ||
      id === view ||
      firstCapturedAt === null ||
      new Date(firstCapturedAt) <= new Date(periodRange(period.days).from),
  );

  const patchGroups = groupBySeason(comparablePatches);
  const recentKeys = recentGroupKeys(patchGroups);
  const recentGroups = patchGroups
    .filter((group) => recentKeys.includes(group.key))
    .sort(
      (first, second) =>
        recentKeys.indexOf(first.key) - recentKeys.indexOf(second.key),
    );
  const olderGroups = patchGroups.filter(
    (group) => !recentKeys.includes(group.key),
  );
  const requestedSeason = searchParams.get("season");
  const selectedSeasonKey =
    olderGroups.find(
      (group) =>
        group.key === (activePatch ? seasonKey(activePatch) : requestedSeason),
    )?.key ?? RECENT_SELECTION;
  const visibleGroups =
    selectedSeasonKey === RECENT_SELECTION
      ? recentGroups
      : olderGroups.filter((group) => group.key === selectedSeasonKey);

  const seasonOptions: IconSelectOption<string>[] = [
    { value: RECENT_SELECTION, label: "Current and previous" },
    ...olderGroups.map((group) => ({ value: group.key, label: group.label })),
  ];

  const periodOptions: IconSelectOption<string>[] = [
    ...availablePeriods.map(([id, period]) => ({
      value: id,
      label: period.label,
      group: "Recent",
    })),
    ...visibleGroups.flatMap((group, index) =>
      group.patches.map((patch) => ({
        value: `${PATCH_PREFIX}${patch.slug}`,
        label: patchLabel(patch),
        group:
          selectedSeasonKey === RECENT_SELECTION &&
          index === 0 &&
          group.season !== null
            ? `${group.label} (current)`
            : group.label,
      })),
    ),
  ];

  function updateView(next: { view?: string; season?: string }) {
    const params = toSearchParams(filters);
    const nextView = next.view ?? view;
    const nextSeason = next.season ?? selectedSeasonKey;
    if (nextView !== DEFAULT_VIEW) {
      params.set("view", nextView);
    }
    if (nextSeason !== RECENT_SELECTION) {
      params.set("season", nextSeason);
    }
    setSearchParams(params);
  }

  const comparisonData = comparison.data;
  const visibleChanges =
    comparisonData?.heroes.filter(
      (change) =>
        (filters.role === null || change.role === filters.role) &&
        matchesName(change.heroName, search),
    ) ?? [];

  const singleSnapshot = comparisonData
    ? comparisonData.beforeCapturedAt === comparisonData.afterCapturedAt
    : false;

  const subtitle =
    comparisonData && !singleSnapshot ? (
      <>
        {activePatch
          ? `After ${activePatch.title ?? `patch ${activePatch.version}`}: changes from `
          : "Changes from "}
        <span title={formatDateTime(comparisonData.beforeCapturedAt)}>
          {formatDate(comparisonData.beforeCapturedAt)}
        </span>{" "}
        to{" "}
        <span title={formatDateTime(comparisonData.afterCapturedAt)}>
          {formatDate(comparisonData.afterCapturedAt)}
        </span>
        .
      </>
    ) : (
      "Which heroes gained or lost win rate, pick rate and ban rate between two snapshots"
    );

  return (
    <>
      <PageHeader
        title="What changed"
        subtitle={subtitle}
        actions={
          <QueueToggle
            value={filters.queue}
            onChange={(queue) => updateFilters({ queue })}
          />
        }
      />
      <StatsFilters
        filters={filters}
        onChange={updateFilters}
        search={search}
        onSearchChange={setSearch}
      >
        {olderGroups.length > 0 && (
          <IconSelect
            label="Season"
            value={selectedSeasonKey}
            options={seasonOptions}
            onChange={(season) =>
              updateView({
                season,
                view: view.startsWith(PATCH_PREFIX) ? DEFAULT_VIEW : view,
              })
            }
          />
        )}
        <IconSelect
          label="Period"
          value={view}
          options={periodOptions}
          onChange={(next) => updateView({ view: next })}
        />
      </StatsFilters>
      {comparison.loading && <TableSkeleton label="Loading comparison" />}
      {comparison.error &&
        (comparison.error.status === 404 ? (
          <EmptyState>
            {activePatch && firstCapturedAt
              ? `Statistics collection started on ${formatDate(firstCapturedAt)}, after this patch, so it cannot be compared.`
              : historyStart.data && firstCapturedAt === null
                ? "Statistics for this platform and region have not been collected yet."
                : "Not enough history yet for this comparison. Statistics are collected daily, so more comparisons become available over time."}
          </EmptyState>
        ) : (
          <ErrorMessage
            failure={comparison.error}
            onRetry={comparison.reload}
          />
        ))}
      {comparisonData && (
        <div
          className={comparison.stale ? "is-stale" : undefined}
          aria-busy={comparison.stale}
        >
          <p className="visually-hidden" role="status">
            {comparison.stale
              ? "Updating results"
              : `${visibleChanges.length} heroes shown`}
          </p>
          {singleSnapshot ? (
            <EmptyState>
              Only one snapshot is available so far (
              {formatDateTime(comparisonData.afterCapturedAt)}), so nothing has
              changed yet. Changes appear once Blizzard's numbers move and a new
              snapshot is collected.
            </EmptyState>
          ) : (
            <ChangesTable
              changes={visibleChanges}
              showBan={!isQuickPlay(filters)}
              portraits={portraits}
            />
          )}
        </div>
      )}
    </>
  );
}
