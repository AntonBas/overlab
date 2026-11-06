import { AllRolesBadge } from "../../../components/ui/AllRolesBadge";
import { RankFilter } from "../../../components/ui/RankFilter";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import clsx from "clsx";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { InfoChip } from "../../../components/ui/InfoChip";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { QueueToggle } from "../../../components/ui/QueueToggle";
import { Spinner } from "../../../components/ui/Spinner";
import { TableSkeleton } from "../../../components/ui/TableSkeleton";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import { useFetch } from "../../../hooks/useFetch";
import { CollectedAt } from "../../../components/ui/CollectedAt";
import { usePageDescription } from "../../../hooks/usePageDescription";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { MAP_PLACEHOLDER_URL, MODE_DESCRIPTIONS } from "../../../utils/modes";
import { matchesName } from "../../../utils/search";
import { MAP_MODE_LABELS, TIER_LABELS } from "../../../utils/format";
import { fetchGuides } from "../../guides/api/guidesApi";
import { FavoriteButton } from "../../personal/components/FavoriteButton";
import { SpotsSection } from "../../guides/components/SpotsSection";
import { fetchStats } from "../../stats/api/statsApi";
import { StatsTable } from "../../stats/components/StatsTable";
import { ROLES, isQuickPlay } from "../../stats/filters";
import { useFilterState } from "../../stats/hooks/useFilterState";
import { MapBestPicks } from "../components/MapBestPicks";
import { MapNavigation } from "../components/MapNavigation";
import { fetchMap, fetchMaps } from "../api/mapsApi";

export function MapPage() {
  const { slug = "" } = useParams();
  const { filters, update, changeSort, key } = useFilterState(slug);
  const map = useFetch(() => fetchMap(slug), [slug]);
  const stats = useFetch(() => fetchStats(filters), [key, slug], {
    keepPrevious: true,
  });
  const guides = useFetch(() => fetchGuides({ map: slug }), [slug]);
  const maps = useFetch(fetchMaps, []);
  const [search, setSearch] = useState("");
  const heroes = stats.data?.heroes ?? [];
  const visibleHeroes = heroes.filter((hero) =>
    matchesName(hero.heroName, search),
  );
  const linkSuffix = isQuickPlay(filters) ? "?queue=quick_play" : "";
  usePageTitle(map.data?.name);
  usePageDescription(
    map.data
      ? `${map.data.name}: win, pick and ban rates of every Overwatch 2 hero on this map.`
      : null,
  );

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
      <section className="map-banner">
        <Thumbnail
          url={map.data.imageUrl ?? MAP_PLACEHOLDER_URL}
          width={1280}
          height={400}
          className="map-banner__image"
        />
        <div className="map-banner__content">
          <h1>{map.data.name}</h1>
          <p>
            {map.data.mode
              ? `${MAP_MODE_LABELS[map.data.mode]} map. Small numbers show the difference from the all-maps value.`
              : "Small numbers show the difference from the all-maps value."}
          </p>
        </div>
      </section>
      <div className="map-actions">
        <div className="map-actions__start">
          {map.data.mode && (
            <InfoChip description={MODE_DESCRIPTIONS[map.data.mode]}>
              <span className="role-badge">
                {MAP_MODE_LABELS[map.data.mode]}
              </span>
            </InfoChip>
          )}
        </div>
        <FavoriteButton kind="map" slug={slug} name={map.data.name} />
        <QueueToggle
          value={filters.queue}
          onChange={(queue) => update({ queue })}
        />
      </div>
      {stats.data && <MapBestPicks heroes={heroes} linkSuffix={linkSuffix} />}
      <div className="filters">
        <RankFilter
          value={filters.tier}
          disabled={isQuickPlay(filters)}
          onChange={(tier) => update({ tier })}
        />
        <label className="field">
          <span className="field__label">Hero</span>
          <input
            type="search"
            value={search}
            placeholder="Search by name"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="segmented" role="group" aria-label="Role">
          <button
            type="button"
            className={clsx("segmented__item", {
              "segmented__item--active": filters.role === null,
            })}
            aria-pressed={filters.role === null}
            onClick={() => update({ role: null })}
          >
            <AllRolesBadge label="All roles" />
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
              <RoleBadge role={role} />
            </button>
          ))}
        </div>
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
              : `${visibleHeroes.length} heroes shown`}
          </p>
          <p className="muted footnote">
            Checked <CollectedAt value={stats.data.capturedAt} />,{" "}
            {TIER_LABELS[filters.tier].toLowerCase()}.
          </p>
          {visibleHeroes.length === 0 ? (
            <EmptyState>No heroes match these filters.</EmptyState>
          ) : (
            <StatsTable
              heroes={visibleHeroes}
              showBan={!isQuickPlay(filters)}
              showDelta
              sort={filters.sort}
              direction={filters.direction}
              onSort={changeSort}
              heroLinkSuffix={linkSuffix}
            />
          )}
        </div>
      )}
      {guides.data && (
        <SpotsSection
          title="Spots & setups"
          guides={guides.data}
          groupBy="hero"
          emptyMessage="No spots or setups for this map yet."
        />
      )}
      {map.data && maps.data && (
        <MapNavigation current={map.data} maps={maps.data} />
      )}
    </>
  );
}
