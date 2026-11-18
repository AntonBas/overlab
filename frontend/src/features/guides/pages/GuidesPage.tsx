import { Link } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { ModeIcon } from "../../../components/ui/ModeIcon";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import { useHeroPortraits, useMapVisuals } from "../../../hooks/useCatalog";
import { useFetch } from "../../../hooks/useFetch";
import { useNoIndex } from "../../../hooks/useNoIndex";
import { usePageDescription } from "../../../hooks/usePageDescription";
import { usePageTitle } from "../../../hooks/usePageTitle";
import {
  breadcrumbList,
  useStructuredData,
} from "../../../hooks/useStructuredData";
import type { Guide } from "../../../types/guide";
import type { GameMap } from "../../../types/map";
import { ROLE_LABELS } from "../../../utils/format";
import { staticSeoPage } from "../../../utils/staticSeoPages";
import { fetchHeroes } from "../../heroes";
import { groupByMode } from "../../maps/utils/groupByMode";
import { MapCard } from "../../maps/components/MapCard";
import { ROLES } from "../../stats";
import { fetchGuides } from "../api/guidesApi";
import { MIN_GUIDES_FOR_LIST_PAGE } from "../constants";
import { SpotCard } from "../components/SpotCard";

const LATEST_GUIDES = 6;

interface GuideGroup {
  slug: string;
  name: string;
  count: number;
  firstPath: string;
}

function groupBy(
  guides: Guide[],
  slugOf: (guide: Guide) => string | null,
  nameOf: (guide: Guide) => string | null,
): GuideGroup[] {
  const groups = new Map<string, GuideGroup>();
  for (const guide of guides) {
    const slug = slugOf(guide);
    const name = nameOf(guide);
    if (slug === null || name === null) {
      continue;
    }
    const group = groups.get(slug);
    if (group) {
      group.count += 1;
    } else {
      groups.set(slug, { slug, name, count: 1, firstPath: guide.path });
    }
  }
  return [...groups.values()].sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}

function guideCount(count: number): string {
  return count === 1 ? "1 guide" : `${count} guides`;
}

function destination(
  listPath: string,
  count: number,
  firstPath: string,
): string {
  return count >= MIN_GUIDES_FOR_LIST_PAGE ? listPath : `/guides/${firstPath}`;
}

export function GuidesPage() {
  const page = staticSeoPage("/guides");
  usePageTitle(page.title);
  usePageDescription(page.description);
  useStructuredData(
    breadcrumbList(
      [
        { name: "Overlab", path: "/" },
        { name: "Guides", path: "/guides" },
      ],
      window.location.origin,
    ),
  );
  const guides = useFetch(() => fetchGuides(), []);
  useNoIndex(guides.data !== null && guides.data.length === 0);
  const heroList = useFetch(fetchHeroes, []);
  const heroPortraits = useHeroPortraits();
  const mapVisuals = useMapVisuals();

  if (guides.loading) {
    return <Spinner page label="Loading guides" />;
  }
  if (guides.error || !guides.data) {
    return guides.error ? (
      <ErrorMessage failure={guides.error} onRetry={guides.reload} />
    ) : null;
  }

  const latest = [...guides.data]
    .sort(
      (first, second) =>
        Date.parse(second.createdAt) - Date.parse(first.createdAt),
    )
    .slice(0, LATEST_GUIDES);
  const heroGroups = new Map(
    groupBy(
      guides.data,
      (guide) => guide.heroSlug,
      (guide) => guide.heroName,
    ).map((group) => [group.slug, group]),
  );
  const heroes = (heroList.data ?? []).filter((hero) =>
    heroGroups.has(hero.slug),
  );
  const maps: (GameMap & { count: number; firstPath: string })[] = groupBy(
    guides.data,
    (guide) => guide.mapSlug,
    (guide) => guide.mapName,
  ).map((group) => ({
    slug: group.slug,
    name: group.name,
    mode: mapVisuals[group.slug]?.mode ?? null,
    imageUrl: mapVisuals[group.slug]?.imageUrl ?? null,
    count: group.count,
    firstPath: group.firstPath,
  }));

  return (
    <>
      <PageHeader
        title={page.heading}
        subtitle="Short videos with positions, setups, ultimates and tips."
      />
      {guides.data.length === 0 ? (
        <EmptyState>No guides yet.</EmptyState>
      ) : (
        <>
          <section className="section" aria-labelledby="latest-guides-heading">
            <h2 id="latest-guides-heading">Latest guides</h2>
            <ul className="spot-grid">
              {latest.map((guide) => (
                <li key={guide.id}>
                  <SpotCard
                    guide={guide}
                    showHero
                    showMap
                    heroPortraits={heroPortraits}
                    mapVisuals={mapVisuals}
                  />
                </li>
              ))}
            </ul>
          </section>
          {heroes.length > 0 && (
            <section
              className="section"
              aria-labelledby="guides-by-hero-heading"
            >
              <h2 id="guides-by-hero-heading">Guides by hero</h2>
              {ROLES.map((role) => {
                const group = heroes.filter((hero) => hero.role === role);
                if (group.length === 0) {
                  return null;
                }
                return (
                  <div key={role} className="guide-hub__group">
                    <h3 className="role-heading">
                      <RoleBadge role={role} compact />
                      {ROLE_LABELS[role]}
                    </h3>
                    <ul className="hero-tiles">
                      {group.map((hero) => (
                        <li key={hero.slug}>
                          <Link
                            className="hero-tile"
                            data-role={hero.role.toLowerCase()}
                            to={destination(
                              `/heroes/${hero.slug}/guides`,
                              heroGroups.get(hero.slug)?.count ?? 0,
                              heroGroups.get(hero.slug)?.firstPath ?? "",
                            )}
                          >
                            <HeroPortrait
                              name={hero.name}
                              url={hero.portraitUrl}
                              size={56}
                            />
                            <span className="hero-tile__name">{hero.name}</span>
                            <span className="hero-tile__count muted">
                              {guideCount(
                                heroGroups.get(hero.slug)?.count ?? 0,
                              )}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>
          )}
          {maps.length > 0 && (
            <section
              className="section map-section"
              aria-labelledby="guides-by-map-heading"
            >
              <h2 id="guides-by-map-heading">Guides by map</h2>
              {groupByMode(maps).map(([label, group]) => (
                <div key={label} className="guide-hub__group">
                  <h3 className="mode-heading">
                    {group.mode && <ModeIcon mode={group.mode} />}
                    {label}
                  </h3>
                  <ul className="map-grid">
                    {group.maps.map((map) => (
                      <li key={map.slug}>
                        <MapCard
                          map={map}
                          to={destination(
                            `/maps/${map.slug}/guides`,
                            map.count,
                            map.firstPath,
                          )}
                          caption={guideCount(map.count)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </>
  );
}
