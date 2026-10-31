import { Link, useParams, useSearchParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { PageHeader } from "../../../components/ui/PageHeader";
import { QueueToggle } from "../../../components/ui/QueueToggle";
import { RoleTags } from "../../../components/ui/RoleTags";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import type { GameQueue } from "../../../types/api";
import { HeroMapPicks } from "../components/HeroMapPicks";
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
import { StatChips } from "../components/StatChips";
import { HeroTraits } from "../components/HeroTraits";
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
        image={
          <HeroPortrait
            name={hero.data.name}
            url={hero.data.portraitUrl}
            size={72}
          />
        }
        subtitle={
          <span className="hero-tags">
            <RoleTags role={hero.data.role} subrole={hero.data.subrole} />
            {overall && (
              <StatChips
                winRate={overall.winRate}
                pickRate={overall.pickRate}
                banRate={overall.banRate}
                showBan={queue === "COMPETITIVE"}
              />
            )}
          </span>
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
      <HeroTraits
        strengths={hero.data.strengths}
        weaknesses={hero.data.weaknesses}
      />

      {perks.data && perks.data.length > 0 && (
        <section className="section">
          <h2>Perks</h2>
          <PerkList perks={perks.data} />
          <p>
            <Link to={`/heroes/${slug}/perks`}>Perks page</Link>
          </p>
        </section>
      )}

      {stats.data && stats.data.maps.length > 0 && (
        <HeroMapPicks
          heroSlug={slug}
          heroName={hero.data.name}
          maps={stats.data.maps}
          linkSuffix={queue === "QUICK_PLAY" ? "?queue=quick_play" : ""}
        />
      )}

      <HeroHistorySection
        title="Statistics"
        slug={slug}
        queue={queue}
        current={overall}
      >
        {stats.loading && <Spinner label="Loading statistics" />}
        {stats.error &&
          (stats.error.status === 404 ? (
            <EmptyState>No statistics collected for this hero yet.</EmptyState>
          ) : (
            <ErrorMessage failure={stats.error} onRetry={stats.reload} />
          ))}
      </HeroHistorySection>

      {stats.data && stats.data.maps.length > 0 && (
        <section className="section">
          <h2>By map</h2>
          <HeroMapTable maps={stats.data.maps} heroSlug={slug} />
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
