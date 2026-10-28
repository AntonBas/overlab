import { Link, useParams, useSearchParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { QueueToggle } from "../../../components/ui/QueueToggle";
import { RateBar } from "../../../components/ui/RateBar";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { CollectedAt } from "../../../components/ui/CollectedAt";
import { usePageTitle } from "../../../hooks/usePageTitle";
import type { GameQueue } from "../../../types/api";
import { HeroHistorySection } from "../../history/components/HeroHistorySection";
import { fetchGuides } from "../../guides/api/guidesApi";
import { GuideList } from "../../guides/components/GuideList";
import { FavoriteButton } from "../../personal/components/FavoriteButton";
import { HeroNote } from "../../personal/components/HeroNote";
import { fetchHeroMapStats } from "../../stats/api/statsApi";
import {
  fetchCounters,
  fetchHero,
  fetchPerks,
  fetchSynergies,
} from "../api/heroesApi";
import { HeroMapTable } from "../components/HeroMapTable";
import { PerkList } from "../components/PerkList";
import { RelatedHeroes } from "../components/RelatedHeroes";

export function HeroPage() {
  const { slug = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queue: GameQueue =
    searchParams.get("queue")?.toUpperCase() === "QUICK_PLAY"
      ? "QUICK_PLAY"
      : "COMPETITIVE";

  const hero = useFetch(() => fetchHero(slug), [slug]);
  const stats = useFetch(
    () =>
      fetchHeroMapStats(slug, {
        queue,
        tier: "ALL",
        platform: "PC",
        region: "EUROPE",
      }),
    [slug, queue],
  );
  const perks = useFetch(() => fetchPerks(slug), [slug]);
  const counters = useFetch(() => fetchCounters(slug), [slug]);
  const synergies = useFetch(() => fetchSynergies(slug), [slug]);
  const guides = useFetch(() => fetchGuides({ hero: slug }), [slug]);
  usePageTitle(hero.data?.name);

  if (hero.loading) {
    return <Spinner />;
  }
  if (hero.error || !hero.data) {
    return hero.error ? (
      <ErrorMessage failure={hero.error} onRetry={hero.reload} />
    ) : null;
  }

  const overall = stats.data?.overall ?? null;

  return (
    <>
      <PageHeader
        title={hero.data.name}
        subtitle={
          <>
            <RoleBadge role={hero.data.role} />
            {hero.data.subrole && (
              <span className="muted"> {hero.data.subrole}</span>
            )}
          </>
        }
        actions={
          <>
            <FavoriteButton kind="hero" slug={slug} name={hero.data.name} />
            <QueueToggle
              value={queue}
              onChange={(next) =>
                setSearchParams(
                  next === "COMPETITIVE" ? {} : { queue: "quick_play" },
                )
              }
            />
          </>
        }
      />
      {hero.data.description && (
        <p className="prose">{hero.data.description}</p>
      )}

      <section className="section">
        <h2>Statistics</h2>
        {stats.loading && <Spinner label="Loading statistics" />}
        {stats.error &&
          (stats.error.status === 404 ? (
            <EmptyState>No statistics collected for this hero yet.</EmptyState>
          ) : (
            <ErrorMessage failure={stats.error} onRetry={stats.reload} />
          ))}
        {overall && (
          <div className="stat-cards">
            <div className="stat-card">
              <span className="muted">Win rate</span>
              <RateBar value={overall.winRate} tone="win" />
            </div>
            <div className="stat-card">
              <span className="muted">Pick rate</span>
              <RateBar value={overall.pickRate} tone="pick" max={40} />
            </div>
            {queue === "COMPETITIVE" && (
              <div className="stat-card">
                <span className="muted">Ban rate</span>
                <RateBar value={overall.banRate} tone="ban" max={50} />
              </div>
            )}
          </div>
        )}
        {overall && (
          <p className="muted footnote">
            All ranks, PC, Europe. Data collected{" "}
            <CollectedAt value={overall.capturedAt} />.
          </p>
        )}
      </section>

      <HeroHistorySection slug={slug} queue={queue} />

      {stats.data && stats.data.maps.length > 0 && (
        <section className="section">
          <h2>By map</h2>
          <HeroMapTable maps={stats.data.maps} heroSlug={slug} />
        </section>
      )}

      {perks.data && perks.data.length > 0 && (
        <section className="section">
          <h2>Perks</h2>
          <PerkList perks={perks.data} />
          <p>
            <Link to={`/heroes/${slug}/perks`}>Perks page</Link>
          </p>
        </section>
      )}

      {counters.data && counters.data.counters.length > 0 && (
        <section className="section">
          <h2>Strong against</h2>
          <RelatedHeroes heroes={counters.data.counters} />
        </section>
      )}
      {counters.data && counters.data.counteredBy.length > 0 && (
        <section className="section">
          <h2>Struggles against</h2>
          <RelatedHeroes heroes={counters.data.counteredBy} />
        </section>
      )}
      {synergies.data && synergies.data.length > 0 && (
        <section className="section">
          <h2>Works well with</h2>
          <RelatedHeroes heroes={synergies.data} />
        </section>
      )}
      {(counters.data?.counters.length ?? 0) +
        (counters.data?.counteredBy.length ?? 0) +
        (synergies.data?.length ?? 0) >
        0 && (
        <p>
          <Link to={`/heroes/${slug}/counters`}>
            All counters and synergies
          </Link>
        </p>
      )}
      {(counters.data?.counters.length ?? 0) +
        (counters.data?.counteredBy.length ?? 0) +
        (synergies.data?.length ?? 0) >
        0 && (
        <p className="muted footnote">
          Counters and synergies are curated recommendations, not statistics.
        </p>
      )}

      {guides.data && guides.data.length > 0 && (
        <section className="section">
          <h2>Video guides</h2>
          <GuideList guides={guides.data} />
        </section>
      )}

      <HeroNote key={slug} heroSlug={slug} />
    </>
  );
}
