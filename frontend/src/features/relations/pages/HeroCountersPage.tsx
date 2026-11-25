import { useParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { ListSkeleton } from "../../../components/ui/ListSkeleton";
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
import {
  RELATION_TAB_SLUGS,
  relationTabIdOf,
  type RelationTabId,
} from "../utils/relationPaths";

function counterTabTitle(name: string, tabId: RelationTabId | undefined) {
  switch (tabId) {
    case "strong":
      return `Heroes ${name} is strong against`;
    case "struggles":
      return `Heroes that counter ${name}`;
    case "synergies":
      return `${name} synergies`;
    default:
      return `${name} counters and synergies`;
  }
}

function counterTabDescription(name: string, tabId: RelationTabId | undefined) {
  switch (tabId) {
    case "strong":
      return `Overwatch ${name} counters: the heroes ${name} is strong against and why.`;
    case "struggles":
      return `Overwatch heroes that counter ${name}: who ${name} struggles against and why.`;
    case "synergies":
      return `Overwatch ${name} synergies: the heroes that work well with ${name} and why.`;
    default:
      return `Overwatch ${name} counters: the heroes ${name} is strong against, the heroes that counter ${name} and who works well with ${name}.`;
  }
}

export function HeroCountersPage() {
  const { slug = "", tab } = useParams();
  const feedback = useRelationFeedback(slug);
  const hero = useFetch(() => fetchHero(slug), [slug]);
  const heroes = useFetch(fetchHeroes, []);
  const counters = useFetch(() => fetchCounters(slug), [slug]);
  const synergies = useFetch(() => fetchSynergies(slug), [slug]);
  const categories = useFetch(fetchHeroCategories, []);
  const name = hero.data?.name;
  useNoIndex(hero.error?.status === 404);
  const tabId = relationTabIdOf(tab);
  usePageTitle(name ? counterTabTitle(name, tabId) : undefined);
  usePageDescription(name ? counterTabDescription(name, tabId) : null);
  useStructuredData(
    name
      ? breadcrumbList(
          [
            { name: "Overlab", path: "/" },
            { name: "Heroes", path: "/heroes" },
            { name, path: `/heroes/${slug}` },
            { name: "Counters", path: `/heroes/${slug}/counters` },
            ...(tabId
              ? [
                  {
                    name: counterTabTitle(name, tabId),
                    path: `/heroes/${slug}/counters/${RELATION_TAB_SLUGS[tabId]}`,
                  },
                ]
              : []),
          ],
          window.location.origin,
        )
      : null,
  );

  if (hero.loading || counters.loading || synergies.loading) {
    return <ListSkeleton kind="detail" label="Loading counters" />;
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
          heroSlug={slug}
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
