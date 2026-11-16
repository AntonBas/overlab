import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import {
  IconSelect,
  type IconSelectOption,
} from "../../../components/ui/IconSelect";
import { HeroHighlights } from "../../../components/ui/HeroHighlights";
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
import type { Patch } from "../../../types/patch";
import {
  formatDate,
  formatDateTime,
  formatPatchDate,
} from "../../../utils/format";
import { matchesName } from "../../../utils/search";
import { fetchPatches } from "../../patches";
import { fetchComparison, fetchHistoryStart } from "../../stats";
import { StatsFilters } from "../../stats";
import { isQuickPlay, toSearchParams } from "../../stats";
import { useRegion } from "../../stats";
import { useFilterState } from "../../stats";
import { ChangesTable } from "../components/ChangesTable";
import { changeHighlights } from "../utils/changeHighlights";
import { periodRange } from "../utils/chart";
import { staticSeoPage } from "../../../utils/staticSeoPages";

const PERIODS: Record<string, { label: string; days: number }> = {
  "7d": { label: "Last 7 days", days: 7 },
  "30d": { label: "Last 30 days", days: 30 },
  "90d": { label: "Last 3 months", days: 90 },
  "180d": { label: "Last 6 months", days: 180 },
  "365d": { label: "Last year", days: 365 },
};

const PATCH_PREFIX = "patch:";
const DEFAULT_VIEW = "7d";

function isKnownViewShape(view: string): boolean {
  return (
    Object.hasOwn(PERIODS, view) ||
    (view.startsWith(PATCH_PREFIX) &&
      /^[a-z0-9]+(-[a-z0-9]+)*$/.test(view.slice(PATCH_PREFIX.length)))
  );
}
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
  return `${patch.title ?? `Patch ${patch.version}`} · ${formatPatchDate(patch.releasedAt)}`;
}

export function ChangesPage() {
  const page = staticSeoPage("/changes");
  usePageTitle(page.title);
  usePageDescription(page.description);
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
  const requestedView = searchParams.get("view") ?? DEFAULT_VIEW;
  const view = isKnownViewShape(requestedView) ? requestedView : DEFAULT_VIEW;
  const { region: defaultRegion } = useRegion();
  const { filters, update: updateFilters } = useFilterState(
    undefined,
    PRESERVED_PARAMS,
  );
  const [search, setSearch] = useState("");
  const patches = useFetch(fetchPatches, []);

  const range = useMemo(
    () =>
      Object.hasOwn(PERIODS, view) ? periodRange(PERIODS[view].days) : null,
    [view],
  );
  const comparison = useFetch(
    (signal) =>
      fetchComparison(
        {
          queue: filters.queue,
          tier: filters.tier,
          platform: filters.platform,
          region: filters.region,
          ...(view.startsWith(PATCH_PREFIX)
            ? { patch: view.slice(PATCH_PREFIX.length) }
            : (range ?? {})),
        },
        signal,
      ),
    [
      filters.queue,
      filters.tier,
      filters.platform,
      filters.region,
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
    const params = toSearchParams(filters, defaultRegion);
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
      {comparisonData && !singleSnapshot && (
        <HeroHighlights
          items={changeHighlights(
            comparisonData.heroes.filter(
              (change) => filters.role === null || change.role === filters.role,
            ),
          )}
        />
      )}
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
            />
          )}
        </div>
      )}
    </>
  );
}
