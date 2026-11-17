import clsx from "clsx";
import { preload } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { NewBadge } from "../../../components/ui/NewBadge";
import { QueueToggle } from "../../../components/ui/QueueToggle";
import { useRegion } from "../../stats";
import { RoleTags } from "../../../components/ui/RoleTags";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { useNoIndex } from "../../../hooks/useNoIndex";
import { usePageDescription } from "../../../hooks/usePageDescription";
import { usePageTitle } from "../../../hooks/usePageTitle";
import {
  breadcrumbList,
  useStructuredData,
} from "../../../hooks/useStructuredData";
import { HeroMapPicks } from "../components/HeroMapPicks";
import { HeroHistorySection } from "../../history";
import { fetchGuides } from "../../guides";
import { SpotsSection } from "../../guides";
import { FavoriteButton } from "../../personal";
import { fetchHeroMapStats } from "../../stats";
import { fetchHeroAbilities } from "../../abilities";
import { fetchPerks } from "../../perks";
import {
  fetchCounters,
  fetchHeroCategories,
  fetchSynergies,
} from "../../relations";
import { fetchHero } from "../api/heroesApi";
import { StatChips } from "../components/StatChips";
import { AbilityList } from "../../abilities";
import { AbilityText } from "../../abilities";
import { ControlSchemeToggle } from "../../abilities";
import { HeroSectionNav } from "../components/HeroSectionNav";
import { HeroTraits } from "../components/HeroTraits";
import { heroBackdropUrl, useHeroBackdrop } from "../../../utils/heroBackdrop";
import { PerkList } from "../../perks";
import { RelationTabs } from "../../relations";
import { useHeroQueue } from "../hooks/useHeroQueue";
import { useRelationFeedback } from "../../relations";
import { heroPageDescription, heroPageTitle } from "../utils/heroSeo";

export function HeroPage() {
  const { slug = "" } = useParams();
  const relationFeedback = useRelationFeedback(slug);
  const { queue, linkSuffix, changeQueue } = useHeroQueue();
  const { region } = useRegion();

  preload(heroBackdropUrl(slug), { as: "image", fetchPriority: "high" });
  const art = useHeroBackdrop(slug);
  const hero = useFetch(() => fetchHero(slug), [slug]);
  useNoIndex(hero.error?.status === 404);
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
    return <Spinner page label="Loading hero" />;
  }
  if (hero.error || !hero.data) {
    return hero.error ? (
      <ErrorMessage failure={hero.error} onRetry={hero.reload} />
    ) : null;
  }

  const failedSections = [counters, synergies, abilities, perks, guides].filter(
    (section) => section.error,
  );
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
    { id: "hero-maps", label: "Maps", visible: hasMaps },
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
    {
      id: "hero-spots",
      label: "Spots",
      visible: (guides.data?.length ?? 0) > 0,
    },
  ].filter((section) => section.visible);

  return (
    <div className="hero-page" data-role={hero.data.role.toLowerCase()}>
      <header className={clsx("hero-header", { "hero-header--art": art })}>
        <div className="hero-header__panel">
          <div className="hero-header__identity">
            <HeroPortrait
              name={hero.data.name}
              url={hero.data.portraitUrl}
              size={88}
            />
            <div className="hero-header__title">
              <h1>
                {hero.data.name}
                {hero.data.recentlyAdded ? <NewBadge /> : null}
              </h1>
              <RoleTags role={hero.data.role} subrole={hero.data.subrole} />
            </div>
          </div>
          <div className="hero-tags__stats">
            {focus && (
              <StatChips
                winRate={focus.winRate}
                pickRate={focus.pickRate}
                banRate={focus.banRate}
                showBan={queue === "COMPETITIVE"}
              />
            )}
          </div>
          {hero.data.description && (
            <p className="prose">
              <AbilityText text={hero.data.description} />
            </p>
          )}
          <div className="hero-header__actions">
            <FavoriteButton kind="hero" slug={slug} name={hero.data.name} />
            <QueueToggle value={queue} onChange={changeQueue} />
          </div>
        </div>
        {art && (
          <div
            className="hero-header__art"
            style={{ backgroundImage: `url(${art})` }}
            aria-hidden="true"
          />
        )}
      </header>
      <HeroTraits
        strengths={hero.data.strengths}
        weaknesses={hero.data.weaknesses}
      />

      {failedSections.length > 0 && (
        <div className="notice notice--error" role="alert">
          <p>Some sections of this page could not be loaded.</p>
          <button
            type="button"
            className="button button--ghost"
            onClick={() =>
              failedSections.forEach((section) => section.reload())
            }
          >
            Try again
          </button>
        </div>
      )}

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

      {hasMaps && stats.data && (
        <div id="hero-maps">
          <HeroMapPicks
            heroName={hero.data.name}
            maps={stats.data.maps}
            linkSuffix={linkSuffix}
            moreHref={`/heroes/${slug}/maps`}
          />
        </div>
      )}

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
            description="Curated recommendations, not statistics."
            moreHref={`/heroes/${slug}/counters`}
          />
        </div>
      )}

      {abilities.data && abilities.data.length > 0 && (
        <section className="section" id="hero-abilities">
          <div className="section__heading">
            <div className="section__title">
              <h2>{hero.data.name} abilities</h2>
              <p className="muted section__description">
                Hover or tap an ability for details. Buttons follow the selected
                platform.
              </p>
            </div>
            <ControlSchemeToggle />
          </div>
          <AbilityList abilities={abilities.data} />
        </section>
      )}

      {perks.data && perks.data.length > 0 && (
        <section className="section" id="hero-perks">
          <div className="section__heading">
            <h2>Best {hero.data.name} perks</h2>
            <Link to={`/heroes/${slug}/perks`}>Perks page</Link>
          </div>
          <p className="muted section__description">
            Recommended perks are the default pick. Optional ones depend on the
            situation.
          </p>
          <PerkList perks={perks.data} />
        </section>
      )}

      {guides.data && guides.data.length > 0 && (
        <div id="hero-spots">
          <SpotsSection
            title="Spots & setups"
            description="Short videos with positions, setups, ultimates and tips."
            guides={spots}
            groupBy="map"
            emptyMessage="No spots or setups yet."
          />
        </div>
      )}
    </div>
  );
}
