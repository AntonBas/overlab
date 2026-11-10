import { useState } from "react";
import { CollectedAt } from "../../../components/ui/CollectedAt";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
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
import { matchesName } from "../../../utils/search";
import { fetchMaps } from "../../maps/api/mapsApi";
import { fetchStats } from "../api/statsApi";
import { DataFreshness } from "../components/DataFreshness";
import { StatsFilters } from "../components/StatsFilters";
import { StatsTable } from "../components/StatsTable";
import { ALL_MAPS, isQuickPlay } from "../filters";
import { useFilterState } from "../hooks/useFilterState";

export function StatsPage() {
  usePageTitle("Hero statistics");
  usePageDescription(
    "Overwatch 2 hero win, pick and ban rates by rank, map, region and platform, updated from Blizzard public data.",
  );
  useStructuredData(
    breadcrumbList(
      [
        { name: "Overlab", path: "/" },
        { name: "Hero statistics", path: "/stats" },
      ],
      window.location.origin,
    ),
  );
  const { filters, update, changeSort, key } = useFilterState();
  const [search, setSearch] = useState("");
  const maps = useFetch(fetchMaps, []);
  const stats = useFetch(() => fetchStats(filters), [key], {
    keepPrevious: true,
  });

  const showDelta = filters.map !== ALL_MAPS;
  const snapshot = stats.data;
  const visibleHeroes =
    snapshot?.heroes.filter((hero) => matchesName(hero.heroName, search)) ?? [];

  return (
    <>
      <PageHeader
        title="Hero statistics"
        subtitle={
          snapshot ? (
            <>
              Checked <CollectedAt value={snapshot.capturedAt} />.{" "}
              <DataFreshness
                queue={filters.queue}
                tier={filters.tier}
                platform={filters.platform}
                region={filters.region}
              />
            </>
          ) : (
            "Win, pick and ban rates collected from Blizzard's public statistics"
          )
        }
        actions={
          <QueueToggle
            value={filters.queue}
            onChange={(queue) => update({ queue })}
          />
        }
      />
      <StatsFilters
        filters={filters}
        maps={maps.data ?? []}
        onChange={update}
        search={search}
        onSearchChange={setSearch}
      />
      {stats.loading && <TableSkeleton label="Loading statistics" />}
      {stats.error &&
        (stats.error.status === 404 ? (
          <EmptyState>
            No statistics have been collected for this combination yet. Map
            statistics are collected once a week.
          </EmptyState>
        ) : (
          <ErrorMessage failure={stats.error} onRetry={stats.reload} />
        ))}
      {snapshot && (
        <div
          className={stats.stale ? "is-stale" : undefined}
          aria-busy={stats.stale}
        >
          <p className="visually-hidden" role="status">
            {stats.stale
              ? "Updating results"
              : `${visibleHeroes.length} heroes shown`}
          </p>
          {visibleHeroes.length === 0 ? (
            <EmptyState>No heroes match these filters.</EmptyState>
          ) : (
            <StatsTable
              heroes={visibleHeroes}
              showBan={!isQuickPlay(filters)}
              showDelta={showDelta}
              sort={filters.sort}
              direction={filters.direction}
              onSort={changeSort}
              heroLinkSuffix={
                filters.queue === "QUICK_PLAY" ? "?queue=quick_play" : ""
              }
            />
          )}
          {showDelta && (
            <p className="muted footnote">
              Small numbers show how each rate differs from its all-maps value.
            </p>
          )}
        </div>
      )}
    </>
  );
}
