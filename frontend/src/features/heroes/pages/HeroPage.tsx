import { useParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { NewBadge } from "../../../components/ui/NewBadge";
import { PageHeader } from "../../../components/ui/PageHeader";
import { QueueToggle } from "../../../components/ui/QueueToggle";
import { useRegion } from "../../stats";
import { RoleTags } from "../../../components/ui/RoleTags";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageDescription } from "../../../hooks/usePageDescription";
import { usePageTitle } from "../../../hooks/usePageTitle";
import {
  breadcrumbList,
  useStructuredData,
} from "../../../hooks/useStructuredData";
import { HeroMapPicks } from "../components/profile/HeroMapPicks";
import { HeroHistorySection } from "../../history";
import { fetchGuides } from "../../guides";
import { SpotsSection } from "../../guides";
import { FavoriteButton } from "../../personal";
import { fetchHeroMapStats } from "../../stats";
import {
  fetchCounters,
  fetchHero,
  fetchHeroCategories,
  fetchPerks,
  fetchHeroAbilities,
  fetchSynergies,
} from "../api/heroesApi";
import { StatChips } from "../components/profile/StatChips";
import { AbilityList } from "../components/abilities/AbilityList";
import { AbilityText } from "../components/abilities/AbilityText";
import { ControlSchemeToggle } from "../components/abilities/ControlSchemeToggle";
import { HeroSectionNav } from "../components/profile/HeroSectionNav";
import { HeroTraits } from "../components/profile/HeroTraits";
import { heroBackdropStyle } from "../utils/heroBackdrop";
import { PerkList } from "../components/profile/PerkList";
import { RelationTabs } from "../components/relations/RelationTabs";
import { useHeroQueue } from "../hooks/useHeroQueue";
import { useRelationFeedback } from "../hooks/useRelationFeedback";
import { heroPageDescription, heroPageTitle } from "../utils/heroSeo";

export function HeroPage() {
  const { slug = "" } = useParams();
  const relationFeedback = useRelationFeedback(slug);
  const { queue, linkSuffix, changeQueue } = useHeroQueue();
  const { region } = useRegion();

  const hero = useFetch(() => fetchHero(slug), [slug]);
  const stats = useFetch(
    () =>
      fetchHeroMapStats(slug, {
        queue,
        tier: "ALL",
        platform: "PC",
        region,
      }),
    [slug, queue, region],
    { keepPrevious: true },
  );
  const perks = useFetch(() => fetchPerks(slug), [slug]);
  const counters = useFetch(() => fetchCounters(slug), [slug]);
  const synergies = useFetch(() => fetchSynergies(slug), [slug]);
  const categories = useFetch(fetchHeroCategories, []);
  const abilities = useFetch(() => fetchHeroAbilities(slug), [slug]);
  const guides = useFetch(() => fetchGuides({ hero: slug }), [slug]);
  usePageTitle(hero.data ? heroPageTitle(hero.data.name) : null);
  usePageDescription(
    hero.data
      ? heroPageDescription(hero.data.name, hero.data.description)
      : null,
  );
  useStructuredData(
    hero.data
      ? breadcrumbList(
          [
            { name: "Overlab", path: "/" },
            { name: "Heroes", path: "/heroes" },
            { name: hero.data.name, path: `/heroes/${hero.data.slug}` },
          ],
          window.location.origin,
        )
      : null,
  );

  if (hero.loading) {
    return <Spinner page />;
  }
  if (hero.error || !hero.data) {
    return hero.error ? (
      <ErrorMessage failure={hero.error} onRetry={hero.reload} />
    ) : null;
  }

  const overall = stats.data?.overall ?? null;
  const focus = overall;
  const spots = guides.data ?? [];
  const hasMaps = (stats.data?.maps.length ?? 0) > 0;
  const heroCategoryMatchups = categories.data?.matchups.filter(
    (matchup) => matchup.heroSlug === slug,
  );
  const hasRelations =
    (counters.data?.counters.length ?? 0) +
      (counters.data?.counteredBy.length ?? 0) +
      (synergies.data?.length ?? 0) +
      (heroCategoryMatchups?.length ?? 0) >
    0;
  const navigationSections = [
    { id: "hero-statistics", label: "Statistics", visible: true },
    { id: "hero-counters", label: "Counters", visible: hasRelations },
    {
      id: "hero-abilities",
      label: "Abilities",
      visible: (abilities.data?.length ?? 0) > 0,
    },
    {
      id: "hero-perks",
      label: "Perks",
      visible: (perks.data?.length ?? 0) > 0,
    },
    { id: "hero-maps", label: "Maps", visible: hasMaps },
    {
      id: "hero-spots",
      label: "Spots",
      visible: (guides.data?.length ?? 0) > 0,
    },
  ].filter((section) => section.visible);

  const backdrop = heroBackdropStyle(slug);
  return (
    <>
      <div
        className={backdrop ? "hero-banner hero-banner--backdrop" : undefined}
        style={backdrop}
      >
        <PageHeader
          title={hero.data.name}
          badge={hero.data.recentlyAdded ? <NewBadge /> : null}
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
              <span className="hero-tags__stats">
                {focus && (
                  <StatChips
                    winRate={focus.winRate}
                    pickRate={focus.pickRate}
                    banRate={focus.banRate}
                    showBan={queue === "COMPETITIVE"}
                  />
                )}
              </span>
            </span>
          }
          actions={
            <>
              <FavoriteButton kind="hero" slug={slug} name={hero.data.name} />
              <QueueToggle value={queue} onChange={changeQueue} />
            </>
          }
        />
        {hero.data.description && (
          <p className="prose">
            <AbilityText text={hero.data.description} />
          </p>
        )}
      </div>
      <HeroTraits
        strengths={hero.data.strengths}
        weaknesses={hero.data.weaknesses}
      />

      <HeroSectionNav sections={navigationSections} />

      <div id="hero-statistics">
        <HeroHistorySection
          title={`${hero.data.name} statistics`}
          slug={slug}
          queue={queue}
          region={region}
          current={focus}
        >
          {stats.loading && <Spinner label="Loading statistics" />}
          {stats.error &&
            (stats.error.status === 404 ? (
              <EmptyState>
                No statistics have been collected for this hero yet.
              </EmptyState>
            ) : (
              <ErrorMessage failure={stats.error} onRetry={stats.reload} />
            ))}
        </HeroHistorySection>
      </div>

      {hasRelations && counters.data && synergies.data && (
        <div id="hero-counters">
          <RelationTabs
            strongAgainst={counters.data.counters}
            counteredBy={counters.data.counteredBy}
            synergies={synergies.data}
            categories={categories.data?.categories}
            categoryMatchups={heroCategoryMatchups}
            feedback={relationFeedback}
            heroName={hero.data.name}
          />
          <p className="muted footnote">
            Counters and synergies are curated recommendations, not statistics.
          </p>
        </div>
      )}

      {abilities.data && abilities.data.length > 0 && (
        <section className="section" id="hero-abilities">
          <div className="section__heading">
            <h2>{hero.data.name} abilities</h2>
            <ControlSchemeToggle />
          </div>
          <AbilityList abilities={abilities.data} />
        </section>
      )}

      {perks.data && perks.data.length > 0 && (
        <section className="section" id="hero-perks">
          <h2>{hero.data.name} perks</h2>
          <PerkList perks={perks.data} />
        </section>
      )}

      {hasMaps && stats.data && (
        <div id="hero-maps">
          <HeroMapPicks
            heroName={hero.data.name}
            maps={stats.data.maps}
            linkSuffix={linkSuffix}
          />
        </div>
      )}

      {guides.data && guides.data.length > 0 && (
        <div id="hero-spots">
          <SpotsSection
            title="Spots & setups"
            guides={spots}
            groupBy="map"
            emptyMessage="No spots or setups yet."
          />
        </div>
      )}
    </>
  );
}
