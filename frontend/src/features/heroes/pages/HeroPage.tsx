import { useEffect } from "react";
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
import { SpotsSection } from "../../guides/components/SpotsSection";
import { FavoriteButton } from "../../personal/components/FavoriteButton";
import { HeroNote } from "../../personal/components/HeroNote";
import { fetchHeroMapStats } from "../../stats/api/statsApi";
import {
  fetchCounters,
  fetchHero,
  fetchPerks,
  fetchHeroAbilities,
  fetchSynergies,
} from "../api/heroesApi";
import { HeroMapTable } from "../components/HeroMapTable";
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

  const mapSlug = searchParams.get("map");
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
  const abilities = useFetch(() => fetchHeroAbilities(slug), [slug]);
  const guides = useFetch(() => fetchGuides({ hero: slug }), [slug]);
  const heroLoaded = Boolean(hero.data);
  usePageTitle(hero.data?.name);

  useEffect(() => {
    if (mapSlug && heroLoaded) {
      document
        .getElementById("hero-statistics")
        ?.scrollIntoView({ block: "start" });
    }
  }, [mapSlug, heroLoaded]);

  if (hero.loading) {
    return <Spinner />;
  }
  if (hero.error || !hero.data) {
    return hero.error ? (
      <ErrorMessage failure={hero.error} onRetry={hero.reload} />
    ) : null;
  }

  const overall = stats.data?.overall ?? null;
  const onMap = mapSlug
    ? (stats.data?.maps.find((entry) => entry.mapSlug === mapSlug) ?? null)
    : null;
  const focus = onMap ?? overall;
  const spots = onMap
    ? [
        ...(guides.data ?? []).filter(
          (guide) => guide.mapSlug === onMap.mapSlug,
        ),
        ...(guides.data ?? []).filter((guide) => guide.mapSlug === null),
      ]
    : (guides.data ?? []);

  function selectMap(next: string) {
    const params = new URLSearchParams(searchParams);
    if (next) {
      params.set("map", next);
    } else {
      params.delete("map");
    }
    setSearchParams(params);
  }

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
          <RoleTags role={hero.data.role} subrole={hero.data.subrole} />
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
          key={onMap?.mapSlug ?? "all"}
          title={onMap ? `Statistics on ${onMap.mapName}` : "Statistics"}
          slug={slug}
          mapSlug={onMap?.mapSlug ?? undefined}
          queue={queue}
          current={focus}
          headerAction={
            stats.data && stats.data.maps.length > 0 ? (
              <label className="field field--inline hero-map-picker">
                <span className="field__label">Map</span>
                <select
                  value={onMap?.mapSlug ?? ""}
                  onChange={(event) => selectMap(event.target.value)}
                >
                  <option value="">All maps</option>
                  {stats.data.maps.map((entry) => (
                    <option key={entry.mapSlug} value={entry.mapSlug ?? ""}>
                      {entry.mapName}
                    </option>
                  ))}
                </select>
              </label>
            ) : undefined
          }
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
          heroSlug={slug}
          heroName={hero.data.name}
          maps={stats.data.maps}
          linkSuffix={linkSuffix}
        />
      )}

      {stats.data && stats.data.maps.length > 0 && (
        <section className="section">
          <h2>By map</h2>
          <HeroMapTable
            maps={stats.data.maps}
            heroSlug={slug}
            linkSuffix={linkSuffix}
          />
        </section>
      )}

      {counters.data && synergies.data && (
        <RelationTabs
          strongAgainst={counters.data.counters}
          counteredBy={counters.data.counteredBy}
          synergies={synergies.data}
        />
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
          key={onMap?.mapSlug ?? "all"}
          title={
            onMap ? `Spots & setups on ${onMap.mapName}` : "Spots & setups"
          }
          guides={spots}
          groupBy={onMap ? "none" : "map"}
          emptyMessage="No spots or setups yet."
        />
      )}

      <HeroNote key={slug} heroSlug={slug} />
    </>
  );
}
