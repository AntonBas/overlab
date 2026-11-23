import { CollectedAt } from "../../../components/ui/CollectedAt";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { HeroHighlights } from "../../../components/ui/HeroHighlights";
import { PageHeader } from "../../../components/ui/PageHeader";
import { QueueToggle } from "../../../components/ui/QueueToggle";
import { TableSkeleton } from "../../../components/ui/TableSkeleton";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { usePageDescription } from "../../../hooks/usePageDescription";
import { SEARCH_PARAMS, useUrlParam } from "../../../hooks/useUrlParam";
import { matchesName } from "../../../utils/search";
import { fetchMaps } from "../../maps";
import { fetchStats } from "../api/statsApi";
import { DataFreshness } from "../components/DataFreshness";
import { StatsFilters } from "../components/StatsFilters";
import { StatsTable } from "../components/StatsTable";
import { ALL_MAPS, isQuickPlay } from "../filters";
import { useFilterState } from "../hooks/useFilterState";
import { statsHighlights } from "../utils/highlights";
import { staticSeoPage } from "../../../utils/staticSeoPages";

export function StatsPage() {
  const page = staticSeoPage("/");
  usePageTitle(page.title);
  usePageDescription(page.description);
  const { filters, update, changeSort, ready, key } = useFilterState(
    undefined,
    SEARCH_PARAMS,
  );
  const [search, setSearch] = useUrlParam("q");
  const maps = useFetch(fetchMaps, []);
  const stats = useFetch((signal) => fetchStats(filters, signal), [key], {
    keepPrevious: true,
    enabled: ready,
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
              {showDelta &&
                " Small numbers show how each rate differs from its all-maps value."}
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
      {!snapshot && stats.loading && (
        <div
          className="hero-highlights hero-highlights--placeholder"
          aria-hidden="true"
        />
      )}
      {snapshot && (
        <HeroHighlights
          items={statsHighlights(snapshot.heroes, !isQuickPlay(filters))}
          heroLinkSuffix={
            filters.queue === "QUICK_PLAY" ? "?queue=quick_play" : ""
          }
        />
      )}
      <StatsFilters
        filters={filters}
        maps={maps.data ?? []}
        onChange={update}
        search={search}
        onSearchChange={setSearch}
      />
      {stats.loading && <TableSkeleton label="Loading statistics" tall />}
      {stats.error &&
        (stats.error.status === 404 ? (
          <EmptyState kind="waiting">
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
            <EmptyState kind="no-match">
              No heroes match these filters.
            </EmptyState>
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
        </div>
      )}
    </>
  );
}
