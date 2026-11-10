import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import {
  fetchCounters,
  fetchHeroCategories,
  fetchSynergies,
} from "../api/heroesApi";
import { HeroSubpageHeader } from "../components/profile/HeroSubpageHeader";
import { RelationTabs } from "../components/relations/RelationTabs";
import { useHeroSubpage } from "../hooks/useHeroSubpage";
import { useRelationFeedback } from "../hooks/useRelationFeedback";

export function HeroCountersPage() {
  const { slug = "" } = useParams();
  const relationFeedback = useRelationFeedback(slug);
  const counters = useFetch(() => fetchCounters(slug), [slug]);
  const synergies = useFetch(() => fetchSynergies(slug), [slug]);
  const categories = useFetch(fetchHeroCategories, []);
  const matchups = categories.data?.matchups.filter(
    (matchup) => matchup.heroSlug === slug,
  );
  const relationCount =
    (counters.data?.counters.length ?? 0) +
    (counters.data?.counteredBy.length ?? 0) +
    (synergies.data?.length ?? 0) +
    (matchups?.length ?? 0);
  const loaded = Boolean(counters.data && synergies.data && categories.data);
  const hero = useHeroSubpage(
    slug,
    "counters",
    loaded ? relationCount > 0 : null,
  );

  if (hero.loading || counters.loading || synergies.loading) {
    return <Spinner page />;
  }
  if (hero.error || !hero.data) {
    return hero.error ? (
      <ErrorMessage failure={hero.error} onRetry={hero.reload} />
    ) : null;
  }
  const name = hero.data.name;

  return (
    <>
      <HeroSubpageHeader
        hero={hero.data}
        section="counters"
        intro={`Who counters ${name}, who ${name} counters and which heroes work well with ${name} in Overwatch 2. These are curated recommendations from Overlab.`}
      />
      {counters.error && (
        <ErrorMessage failure={counters.error} onRetry={counters.reload} />
      )}
      {counters.data && synergies.data && relationCount > 0 && (
        <RelationTabs
          strongAgainst={counters.data.counters}
          counteredBy={counters.data.counteredBy}
          synergies={synergies.data}
          categories={categories.data?.categories}
          categoryMatchups={matchups}
          feedback={relationFeedback}
          heroName={name}
        />
      )}
      {counters.data && synergies.data && relationCount === 0 && (
        <EmptyState>
          No counters or synergies have been added for {name} yet.
        </EmptyState>
      )}
      <p className="muted footnote">
        Counters and synergies are curated recommendations, not statistics. See
        the <Link to="/counters">counters of every hero</Link>.
      </p>
    </>
  );
}
