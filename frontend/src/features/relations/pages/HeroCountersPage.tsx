import { useParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { useNoIndex } from "../../../hooks/useNoIndex";
import { usePageDescription } from "../../../hooks/usePageDescription";
import { usePageTitle } from "../../../hooks/usePageTitle";
import {
  breadcrumbList,
  useStructuredData,
} from "../../../hooks/useStructuredData";
import { HeroSubPageLayout, fetchHero, fetchHeroes } from "../../heroes";
import {
  fetchCounters,
  fetchHeroCategories,
  fetchSynergies,
} from "../api/relationsApi";
import { RelationTabs } from "../components/RelationTabs";
import { useRelationFeedback } from "../hooks/useRelationFeedback";

export function HeroCountersPage() {
  const { slug = "" } = useParams();
  const feedback = useRelationFeedback(slug);
  const hero = useFetch(() => fetchHero(slug), [slug]);
  const heroes = useFetch(fetchHeroes, []);
  const counters = useFetch(() => fetchCounters(slug), [slug]);
  const synergies = useFetch(() => fetchSynergies(slug), [slug]);
  const categories = useFetch(fetchHeroCategories, []);
  const name = hero.data?.name;
  useNoIndex(hero.error?.status === 404);
  usePageTitle(name ? `${name} counters and synergies` : undefined);
  usePageDescription(
    name
      ? `Overwatch ${name} counters: the heroes ${name} is strong against, the heroes that counter ${name} and who works well with ${name}.`
      : null,
  );
  useStructuredData(
    name
      ? breadcrumbList(
          [
            { name: "Overlab", path: "/" },
            { name: "Heroes", path: "/heroes" },
            { name, path: `/heroes/${slug}` },
            { name: "Counters", path: `/heroes/${slug}/counters` },
          ],
          window.location.origin,
        )
      : null,
  );

  if (hero.loading || counters.loading || synergies.loading) {
    return <Spinner page label="Loading counters" />;
  }
  const failure = hero.error ?? counters.error ?? synergies.error;
  if (failure || !hero.data || !counters.data || !synergies.data) {
    return failure ? (
      <ErrorMessage
        failure={failure}
        onRetry={() => {
          hero.reload();
          counters.reload();
          synergies.reload();
        }}
      />
    ) : null;
  }
  const current = hero.data;
  const matchups = categories.data?.matchups.filter(
    (matchup) => matchup.heroSlug === slug,
  );
  const empty =
    counters.data.counters.length +
      counters.data.counteredBy.length +
      synergies.data.length +
      (matchups?.length ?? 0) ===
    0;

  return (
    <HeroSubPageLayout
      hero={current}
      allHeroes={heroes.data ?? []}
      section="Counters"
      allHref="/counters"
      sectionPath="counters"
      allLabel="All counters"
      title={`${current.name} counters and synergies`}
      subtitle="Curated recommendations, not statistics."
    >
      {empty ? (
        <EmptyState>No recommendations for {current.name} yet.</EmptyState>
      ) : (
        <RelationTabs
          strongAgainst={counters.data.counters}
          counteredBy={counters.data.counteredBy}
          synergies={synergies.data}
          categories={categories.data?.categories}
          categoryMatchups={matchups}
          feedback={feedback}
          heroName={current.name}
          showHeading={false}
        />
      )}
    </HeroSubPageLayout>
  );
}
