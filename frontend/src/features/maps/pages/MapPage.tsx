import clsx from "clsx";
import { useParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { QueueToggle } from "../../../components/ui/QueueToggle";
import { Spinner } from "../../../components/ui/Spinner";
import { TableSkeleton } from "../../../components/ui/TableSkeleton";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import {
  MAP_MODE_LABELS,
  ROLE_LABELS,
  formatDateTime,
} from "../../../utils/format";
import { fetchGuides } from "../../guides/api/guidesApi";
import { GuideList } from "../../guides/components/GuideList";
import { fetchStats } from "../../stats/api/statsApi";
import { StatsTable } from "../../stats/components/StatsTable";
import { ROLES, isQuickPlay } from "../../stats/filters";
import { useFilterState } from "../../stats/hooks/useFilterState";
import { fetchMap } from "../api/mapsApi";

export function MapPage() {
  const { slug = "" } = useParams();
  const { filters, update, changeSort, key } = useFilterState(slug);
  const map = useFetch(() => fetchMap(slug), [slug]);
  const stats = useFetch(() => fetchStats(filters), [key, slug], {
    keepPrevious: true,
  });
  const guides = useFetch(() => fetchGuides({ map: slug }), [slug]);
  usePageTitle(map.data?.name);

  if (map.loading) {
    return <Spinner />;
  }
  if (map.error || !map.data) {
    return map.error ? (
      <ErrorMessage failure={map.error} onRetry={map.reload} />
    ) : null;
  }

  return (
    <>
      <PageHeader
        title={map.data.name}
        subtitle={
          map.data.mode
            ? `${MAP_MODE_LABELS[map.data.mode]} map. Small numbers show the difference from the all-maps value.`
            : "Small numbers show the difference from the all-maps value."
        }
        actions={
          <QueueToggle
            value={filters.queue}
            onChange={(queue) => update({ queue })}
          />
        }
      />
      <div className="segmented" role="group" aria-label="Role">
        <button
          type="button"
          className={clsx("segmented__item", {
            "segmented__item--active": filters.role === null,
          })}
          aria-pressed={filters.role === null}
          onClick={() => update({ role: null })}
        >
          All roles
        </button>
        {ROLES.map((role) => (
          <button
            key={role}
            type="button"
            className={clsx("segmented__item", {
              "segmented__item--active": filters.role === role,
            })}
            aria-pressed={filters.role === role}
            onClick={() => update({ role })}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </div>
      {stats.loading && <TableSkeleton label="Loading statistics" />}
      {stats.error &&
        (stats.error.status === 404 ? (
          <EmptyState>
            No statistics have been collected for this map yet.
          </EmptyState>
        ) : (
          <ErrorMessage failure={stats.error} onRetry={stats.reload} />
        ))}
      {stats.data && (
        <div
          className={stats.stale ? "is-stale" : undefined}
          aria-busy={stats.stale}
        >
          <p className="visually-hidden" role="status">
            {stats.stale
              ? "Updating results"
              : `${stats.data.heroes.length} heroes shown`}
          </p>
          <p className="muted footnote">
            Snapshot from {formatDateTime(stats.data.capturedAt)}, all ranks.
          </p>
          <StatsTable
            heroes={stats.data.heroes}
            showBan={!isQuickPlay(filters)}
            showDelta
            sort={filters.sort}
            direction={filters.direction}
            onSort={changeSort}
            heroLinkSuffix={isQuickPlay(filters) ? "?queue=quick_play" : ""}
            mapSlug={slug}
          />
        </div>
      )}
      {guides.data && (
        <section className="section">
          <h2>Video guides on this map</h2>
          {guides.data.length > 0 ? (
            <GuideList guides={guides.data} />
          ) : (
            <EmptyState>No guides for this map yet.</EmptyState>
          )}
        </section>
      )}
    </>
  );
}
