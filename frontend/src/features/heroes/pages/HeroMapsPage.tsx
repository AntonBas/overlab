import { useParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { QueueToggle } from "../../../components/ui/QueueToggle";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { useNoIndex } from "../../../hooks/useNoIndex";
import { usePageDescription } from "../../../hooks/usePageDescription";
import { usePageTitle } from "../../../hooks/usePageTitle";
import {
  breadcrumbList,
  useStructuredData,
} from "../../../hooks/useStructuredData";
import { fetchHeroMapStats, useRegion } from "../../stats";
import { fetchHero, fetchHeroes } from "../api/heroesApi";
import { HeroMapPicks } from "../components/HeroMapPicks";
import { HeroSubPageLayout } from "../components/HeroSubPageLayout";
import { useHeroQueue } from "../hooks/useHeroQueue";

export function HeroMapsPage() {
  const { slug = "" } = useParams();
  const { queue, linkSuffix, changeQueue } = useHeroQueue();
  const { region } = useRegion();
  const hero = useFetch(() => fetchHero(slug), [slug]);
  const heroes = useFetch(fetchHeroes, []);
  const stats = useFetch(
    () =>
      fetchHeroMapStats(slug, { queue, tier: "ALL", platform: "PC", region }),
    [slug, queue, region],
    { keepPrevious: true },
  );
  const name = hero.data?.name;
  useNoIndex(hero.error?.status === 404);
  usePageTitle(name ? `Best and worst maps for ${name}` : undefined);
  usePageDescription(
    name
      ? `Best and worst Overwatch maps for ${name}: win and pick rate on every map compared with ${name}'s average.`
      : null,
  );
  useStructuredData(
    name
      ? breadcrumbList(
          [
            { name: "Overlab", path: "/" },
            { name: "Heroes", path: "/heroes" },
            { name, path: `/heroes/${slug}` },
            { name: "Maps", path: `/heroes/${slug}/maps` },
          ],
          window.location.origin,
        )
      : null,
  );

  if (hero.loading) {
    return <Spinner page label="Loading hero map statistics" />;
  }
  if (hero.error || !hero.data) {
    return hero.error ? (
      <ErrorMessage failure={hero.error} onRetry={hero.reload} />
    ) : null;
  }
  const current = hero.data;

  return (
    <HeroSubPageLayout
      hero={current}
      allHeroes={heroes.data ?? []}
      section="Maps"
      allHref="/maps"
      sectionPath="maps"
      linkSuffix={linkSuffix}
      allLabel="All maps"
      title={`${current.name} maps`}
      subtitle="Win and pick rate on every map compared with the hero's average."
      actions={<QueueToggle value={queue} onChange={changeQueue} />}
    >
      {stats.loading && !stats.data && <Spinner label="Loading statistics" />}
      {stats.error &&
        (stats.error.status === 404 ? (
          <EmptyState>
            No statistics have been collected for this hero yet.
          </EmptyState>
        ) : (
          <ErrorMessage failure={stats.error} onRetry={stats.reload} />
        ))}
      {stats.data && stats.data.maps.length > 0 && (
        <HeroMapPicks
          heroName={current.name}
          maps={stats.data.maps}
          linkSuffix={linkSuffix}
        />
      )}
    </HeroSubPageLayout>
  );
}
