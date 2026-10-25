import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { formatDateTime } from "../../../utils/format";
import { fetchMaps } from "../../maps/api/mapsApi";
import { fetchStats } from "../api/statsApi";
import { StatsFilters } from "../components/StatsFilters";
import { StatsTable } from "../components/StatsTable";
import { ALL_MAPS, isQuickPlay } from "../filters";
import { useFilterState } from "../hooks/useFilterState";

export function StatsPage() {
  usePageTitle("Hero statistics");
  const { filters, update, changeSort, key } = useFilterState();
  const maps = useFetch(fetchMaps, []);
  const stats = useFetch(() => fetchStats(filters), [key]);

  const showDelta = filters.map !== ALL_MAPS;
  const snapshot = stats.data;

  return (
    <>
      <PageHeader
        title="Hero statistics"
        subtitle={
          snapshot
            ? `Snapshot from ${formatDateTime(snapshot.capturedAt)}`
            : "Win, pick and ban rates collected from Blizzard's public statistics"
        }
      />
      <StatsFilters
        filters={filters}
        maps={maps.data ?? []}
        onChange={update}
      />
      {stats.loading && <Spinner label="Loading statistics" />}
      {stats.error &&
        (stats.error.status === 404 ? (
          <EmptyState>
            No statistics have been collected for this combination yet. Map
            statistics are currently collected for all ranks together.
          </EmptyState>
        ) : (
          <ErrorMessage failure={stats.error} onRetry={stats.reload} />
        ))}
      {!stats.loading && snapshot && (
        <>
          {snapshot.heroes.length === 0 ? (
            <EmptyState>No heroes match these filters.</EmptyState>
          ) : (
            <StatsTable
              heroes={snapshot.heroes}
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
              Small numbers show the difference from the all-maps value.
            </p>
          )}
        </>
      )}
    </>
  );
}
