import { useParams, useSearchParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { PageHeader } from "../../../components/ui/PageHeader";
import { QueueToggle } from "../../../components/ui/QueueToggle";
import { RoleTags } from "../../../components/ui/RoleTags";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import {
  plainDescription,
  usePageDescription,
} from "../../../hooks/usePageDescription";
import { usePageTitle } from "../../../hooks/usePageTitle";
import type { GameQueue } from "../../../types/api";
import { HeroMapPicks } from "../components/HeroMapPicks";
import { HeroHistorySection } from "../../history/components/HeroHistorySection";
import { fetchGuides } from "../../guides/api/guidesApi";
import { SpotsSection } from "../../guides/components/SpotsSection";
import { FavoriteButton } from "../../personal/components/FavoriteButton";
import { HeroNote } from "../../personal/components/HeroNote";
import { fetchHeroMapStats } from "../../stats/api/statsApi";
import {
  fetchCounters,
  fetchHero,
  fetchHeroCategories,
  fetchPerks,
  fetchHeroAbilities,
  fetchSynergies,
} from "../api/heroesApi";
import { HeroMapTable } from "../components/HeroMapTable";
import { StatChips } from "../components/StatChips";
import { AbilityList } from "../components/AbilityList";
import { AbilityText } from "../components/AbilityText";
import { ControlSchemeToggle } from "../components/ControlSchemeToggle";
import { HeroTraits } from "../components/HeroTraits";
import { PerkList } from "../components/PerkList";
import { RelationTabs } from "../components/RelationTabs";

export function HeroPage() {
  const { slug = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queue: GameQueue =
    searchParams.get("queue")?.toUpperCase() === "QUICK_PLAY"
      ? "QUICK_PLAY"
      : "COMPETITIVE";

  const linkSuffix = queue === "QUICK_PLAY" ? "?queue=quick_play" : "";

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
  const categories = useFetch(fetchHeroCategories, []);
  const abilities = useFetch(() => fetchHeroAbilities(slug), [slug]);
  const guides = useFetch(() => fetchGuides({ hero: slug }), [slug]);
  usePageTitle(hero.data?.name);
  usePageDescription(
    hero.data
      ? plainDescription(
          `${hero.data.name}: ${hero.data.description ?? "Overwatch 2 hero statistics, perks and counters."}`,
        )
      : null,
  );

  if (hero.loading) {
    return <Spinner />;
  }
  if (hero.error || !hero.data) {
    return hero.error ? (
      <ErrorMessage failure={hero.error} onRetry={hero.reload} />
    ) : null;
  }

  const overall = stats.data?.overall ?? null;
  const focus = overall;
  const spots = guides.data ?? [];

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
            {focus && (
              <StatChips
                winRate={focus.winRate}
                pickRate={focus.pickRate}
                banRate={focus.banRate}
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
              onChange={(next) => {
                const params = new URLSearchParams(searchParams);
                if (next === "COMPETITIVE") {
                  params.delete("queue");
                } else {
                  params.set("queue", "quick_play");
                }
                setSearchParams(params);
              }}
            />
          </>
        }
      />
      {hero.data.description && (
        <p className="prose">
          <AbilityText text={hero.data.description} />
        </p>
      )}
      <HeroTraits
        strengths={hero.data.strengths}
        weaknesses={hero.data.weaknesses}
      />

      <div id="hero-statistics">
        <HeroHistorySection
          title="Statistics"
          slug={slug}
          queue={queue}
          current={focus}
        >
          {stats.loading && <Spinner label="Loading statistics" />}
          {stats.error &&
            (stats.error.status === 404 ? (
              <EmptyState>
                No statistics collected for this hero yet.
              </EmptyState>
            ) : (
              <ErrorMessage failure={stats.error} onRetry={stats.reload} />
            ))}
        </HeroHistorySection>
      </div>

      {stats.data && stats.data.maps.length > 0 && (
        <HeroMapPicks
          heroName={hero.data.name}
          maps={stats.data.maps}
          linkSuffix={linkSuffix}
        />
      )}

      {stats.data && stats.data.maps.length > 0 && (
        <section className="section">
          <h2>By map</h2>
          <HeroMapTable maps={stats.data.maps} linkSuffix={linkSuffix} />
        </section>
      )}

      {counters.data && synergies.data && (
        <RelationTabs
          strongAgainst={counters.data.counters}
          counteredBy={counters.data.counteredBy}
          synergies={synergies.data}
          categories={categories.data?.categories}
          categoryMatchups={categories.data?.matchups.filter(
            (matchup) => matchup.heroSlug === slug,
          )}
        />
      )}
      {(counters.data?.counters.length ?? 0) +
        (counters.data?.counteredBy.length ?? 0) +
        (synergies.data?.length ?? 0) >
        0 && (
        <p className="muted footnote">
          Counters and synergies are curated recommendations, not statistics.
        </p>
      )}

      {abilities.data && abilities.data.length > 0 && (
        <section className="section">
          <div className="section__heading">
            <h2>Abilities</h2>
            <ControlSchemeToggle />
          </div>
          <AbilityList abilities={abilities.data} />
        </section>
      )}

      {perks.data && perks.data.length > 0 && (
        <section className="section">
          <h2>Perks</h2>
          <PerkList perks={perks.data} />
        </section>
      )}

      {guides.data && guides.data.length > 0 && (
        <SpotsSection
          title="Spots & setups"
          guides={spots}
          groupBy="map"
          emptyMessage="No spots or setups yet."
        />
      )}

      <HeroNote key={slug} heroSlug={slug} />
    </>
  );
}
