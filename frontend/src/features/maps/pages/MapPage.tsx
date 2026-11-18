import { AllRolesBadge } from "../../../components/ui/AllRolesBadge";
import { RankFilter } from "../../../components/ui/RankFilter";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import clsx from "clsx";
import { useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ModeIcon } from "../../../components/ui/ModeIcon";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { QueueToggle } from "../../../components/ui/QueueToggle";
import { ShowMoreButton } from "../../../components/ui/ShowMoreButton";
import { ListSkeleton } from "../../../components/ui/ListSkeleton";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import { TableSkeleton } from "../../../components/ui/TableSkeleton";
import { useFetch } from "../../../hooks/useFetch";
import { useNoIndex } from "../../../hooks/useNoIndex";
import { CollectedAt } from "../../../components/ui/CollectedAt";
import { usePageDescription } from "../../../hooks/usePageDescription";
import { usePageTitle } from "../../../hooks/usePageTitle";
import {
  breadcrumbList,
  useStructuredData,
} from "../../../hooks/useStructuredData";
import { MAP_PLACEHOLDER_URL } from "../../../utils/modes";
import { SEARCH_PARAMS, useUrlParam } from "../../../hooks/useUrlParam";
import { matchesName } from "../../../utils/search";
import { MAP_MODE_LABELS, TIER_LABELS } from "../../../utils/format";
import { fetchGuides } from "../../guides";
import { FavoriteButton } from "../../personal";
import { SpotsSection } from "../../guides";
import { fetchStats } from "../../stats";
import { StatsTable } from "../../stats";
import { useCoverage } from "../../stats";
import { ROLES, availableTiers, isQuickPlay } from "../../stats";
import { useFilterState } from "../../stats";
import { MapBestPicks } from "../components/MapBestPicks";
import { MapNavigation } from "../components/MapNavigation";
import { fetchMap, fetchMaps } from "../api/mapsApi";
import { FiltersPanel } from "../../../components/ui/FiltersPanel";

const INITIAL_HERO_ROWS = 10;

export function MapPage() {
  const { slug = "" } = useParams();
  const { filters, update, changeSort, ready, key } = useFilterState(
    slug,
    SEARCH_PARAMS,
  );
  const coverage = useCoverage();
  const map = useFetch(() => fetchMap(slug), [slug]);
  useNoIndex(map.error?.status === 404);
  const stats = useFetch((signal) => fetchStats(filters, signal), [key, slug], {
    keepPrevious: true,
    enabled: ready,
  });
  const picksKey = `${filters.queue}|${filters.tier}|${filters.platform}|${filters.region}|${slug}`;
  const allRolesStats = useFetch(
    () =>
      filters.role === null
        ? Promise.resolve(null)
        : fetchStats({ ...filters, role: null }),
    [picksKey, filters.role === null],
    { keepPrevious: true, enabled: ready },
  );
  const guides = useFetch(() => fetchGuides({ map: slug }), [slug]);
  const maps = useFetch(fetchMaps, []);
  const [search, setSearch] = useUrlParam("q");
  const heroes = stats.data?.heroes ?? [];
  const pickHeroes =
    filters.role === null ? heroes : (allRolesStats.data?.heroes ?? []);
  const visibleHeroes = heroes.filter((hero) =>
    matchesName(hero.heroName, search),
  );
  const linkSuffix = isQuickPlay(filters) ? "?queue=quick_play" : "";
  const filterKey = `${key}|${search}`;
  const [expandedFor, setExpandedFor] = useState<string | null>(null);
  const showAllHeroes = expandedFor === filterKey;
  const statisticsRef = useRef<HTMLElement>(null);
  const wasShowingAll = useRef(false);
  useLayoutEffect(() => {
    if (wasShowingAll.current && !showAllHeroes) {
      statisticsRef.current?.scrollIntoView({ block: "start" });
    }
    wasShowingAll.current = showAllHeroes;
  }, [showAllHeroes]);
  const shownHeroes = showAllHeroes
    ? visibleHeroes
    : visibleHeroes.slice(0, INITIAL_HERO_ROWS);
  usePageTitle(map.data?.name);
  usePageDescription(
    map.data
      ? `${map.data.name}: win, pick and ban rates of every Overwatch hero on this map.`
      : null,
  );
  useStructuredData(
    map.data
      ? breadcrumbList(
          [
            { name: "Overlab", path: "/" },
            { name: "Maps", path: "/maps" },
            { name: map.data.name, path: `/maps/${map.data.slug}` },
          ],
          window.location.origin,
        )
      : null,
  );

  if (map.loading) {
    return <ListSkeleton kind="detail" label="Loading map" />;
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
          priority
        />
        <div className="map-banner__content">
          <h1>{map.data.name}</h1>
          {map.data.mode && (
            <p className="map-banner__mode">
              <ModeIcon mode={map.data.mode} />
              <strong>{MAP_MODE_LABELS[map.data.mode]}</strong>
            </p>
          )}
        </div>
        <div className="map-actions">
          <FavoriteButton kind="map" slug={slug} name={map.data.name} />
          <QueueToggle
            value={filters.queue}
            onChange={(queue) => update({ queue })}
          />
        </div>
      </section>
      {!stats.data && stats.loading && (
        <section
          className="section map-best-picks-skeleton"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="visually-hidden">Loading best picks...</span>
          <div className="map-best-picks-skeleton__title" aria-hidden="true" />
          <div className="highlights" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div key={index} className="map-best-picks-skeleton__card" />
            ))}
          </div>
        </section>
      )}
      {stats.data && (
        <MapBestPicks
          heroes={pickHeroes}
          mapName={map.data.name}
          linkSuffix={linkSuffix}
        />
      )}
      <section ref={statisticsRef} className="section map-statistics">
        <div className="section__title">
          <h2>{map.data.name} hero statistics</h2>
          {stats.data && (
            <p className="muted section__description">
              Checked <CollectedAt value={stats.data.capturedAt} />,{" "}
              {TIER_LABELS[filters.tier].toLowerCase()}. Small numbers show the
              difference from the all-maps value.
            </p>
          )}
        </div>
        <FiltersPanel>
          <div className="filters">
            {!isQuickPlay(filters) && (
              <RankFilter
                value={filters.tier}
                tiers={availableTiers(coverage, filters)}
                onChange={(tier) => update({ tier })}
              />
            )}
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
        </FiltersPanel>
        {stats.loading && <TableSkeleton label="Loading statistics" />}
        {stats.error &&
          (stats.error.status === 404 ? (
            <EmptyState kind="waiting">
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
            {visibleHeroes.length === 0 ? (
              <EmptyState kind="no-match">
                No heroes match these filters.
              </EmptyState>
            ) : (
              <StatsTable
                heroes={shownHeroes}
                showBan={!isQuickPlay(filters)}
                showDelta
                sort={filters.sort}
                direction={filters.direction}
                onSort={changeSort}
                heroLinkSuffix={linkSuffix}
              />
            )}
            {visibleHeroes.length > INITIAL_HERO_ROWS && (
              <ShowMoreButton
                attached
                label="Show all heroes"
                expandedLabel="Show fewer heroes"
                expanded={showAllHeroes}
                onClick={() => setExpandedFor(showAllHeroes ? null : filterKey)}
              />
            )}
          </div>
        )}
      </section>
      {guides.data && (
        <SpotsSection
          title="Spots & setups"
          description="Short videos with positions, setups, ultimates and tips."
          guides={guides.data}
          groupBy="hero"
          moreHref={`/maps/${slug}/guides`}
          emptyMessage="No spots or setups for this map yet."
        />
      )}
      {map.data && maps.data && (
        <MapNavigation current={map.data} maps={maps.data} />
      )}
    </>
  );
}
