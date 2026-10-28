import { Link, useParams, useSearchParams } from "react-router-dom";
import { DeltaValue } from "../../../components/ui/DeltaValue";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { QueueToggle } from "../../../components/ui/QueueToggle";
import { RateBar } from "../../../components/ui/RateBar";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { CollectedAt } from "../../../components/ui/CollectedAt";
import { usePageTitle } from "../../../hooks/usePageTitle";
import type { GameQueue } from "../../../types/api";
import { fetchGuides } from "../../guides/api/guidesApi";
import { GuideList } from "../../guides/components/GuideList";
import { fetchMap } from "../../maps/api/mapsApi";
import { fetchHeroMapStats } from "../../stats/api/statsApi";
import { fetchHero } from "../api/heroesApi";

export function HeroOnMapPage() {
  const { map: mapSlug = "", hero: heroSlug = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queue: GameQueue =
    searchParams.get("queue")?.toUpperCase() === "QUICK_PLAY"
      ? "QUICK_PLAY"
      : "COMPETITIVE";

  const hero = useFetch(() => fetchHero(heroSlug), [heroSlug]);
  const map = useFetch(() => fetchMap(mapSlug), [mapSlug]);
  const stats = useFetch(
    () =>
      fetchHeroMapStats(heroSlug, {
        queue,
        tier: "ALL",
        platform: "PC",
        region: "EUROPE",
      }),
    [heroSlug, queue],
    { keepPrevious: true },
  );
  const guides = useFetch(
    () => fetchGuides({ hero: heroSlug, map: mapSlug }),
    [heroSlug, mapSlug],
  );
  usePageTitle(
    hero.data && map.data ? `${hero.data.name} on ${map.data.name}` : null,
  );

  if (hero.loading || map.loading) {
    return <Spinner />;
  }
  const failure = hero.error ?? map.error;
  if (failure || !hero.data || !map.data) {
    return failure ? <ErrorMessage failure={failure} /> : null;
  }

  const onMap = stats.data?.maps.find((entry) => entry.mapSlug === mapSlug);
  const overall = stats.data?.overall ?? null;

  return (
    <>
      <PageHeader
        title={`${hero.data.name} on ${map.data.name}`}
        subtitle={
          <>
            <Link to={`/heroes/${heroSlug}`}>{hero.data.name}</Link>
            {" | "}
            <Link to={`/maps/${mapSlug}`}>{map.data.name}</Link>
          </>
        }
        actions={
          <QueueToggle
            value={queue}
            onChange={(next) =>
              setSearchParams(
                next === "COMPETITIVE" ? {} : { queue: "quick_play" },
              )
            }
          />
        }
      />
      <section
        className={stats.stale ? "section is-stale" : "section"}
        aria-busy={stats.stale}
        aria-live="polite"
      >
        {stats.loading && <Spinner label="Loading statistics" />}
        {stats.error && (
          <ErrorMessage failure={stats.error} onRetry={stats.reload} />
        )}
        {stats.data && !onMap && (
          <EmptyState>
            No statistics for {hero.data.name} on {map.data.name} yet.
          </EmptyState>
        )}
        {onMap && (
          <>
            <div className="stat-cards">
              <div className="stat-card">
                <span className="muted">Win rate</span>
                <RateBar value={onMap.winRate} tone="win" />
                <DeltaValue value={onMap.winRateDelta} />
              </div>
              <div className="stat-card">
                <span className="muted">Pick rate</span>
                <RateBar value={onMap.pickRate} tone="pick" max={40} />
                <DeltaValue value={onMap.pickRateDelta} />
              </div>
              {queue === "COMPETITIVE" && onMap.banRate !== null && (
                <div className="stat-card">
                  <span className="muted">Ban rate</span>
                  <RateBar value={onMap.banRate} tone="ban" max={50} />
                </div>
              )}
            </div>
            <p className="muted footnote">
              Small numbers show the difference from{" "}
              {overall
                ? `${hero.data.name}'s all-maps values`
                : "the all-maps values"}
              . All ranks, PC, Europe. Data collected{" "}
              <CollectedAt value={onMap.capturedAt} />.
            </p>
          </>
        )}
      </section>
      <section className="section">
        <h2>
          Video guides for {hero.data.name} on {map.data.name}
        </h2>
        {guides.data && guides.data.length > 0 ? (
          <GuideList guides={guides.data} />
        ) : (
          !guides.loading && (
            <EmptyState>No guides for this pair yet.</EmptyState>
          )
        )}
      </section>
    </>
  );
}
