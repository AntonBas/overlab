import { useParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { fetchCounters, fetchHero, fetchSynergies } from "../api/heroesApi";
import { HeroSubpageHeader } from "../components/HeroSubpageHeader";
import { RelatedHeroes } from "../components/RelatedHeroes";

export function HeroCountersPage() {
  const { slug = "" } = useParams();
  const hero = useFetch(() => fetchHero(slug), [slug]);
  const counters = useFetch(() => fetchCounters(slug), [slug]);
  const synergies = useFetch(() => fetchSynergies(slug), [slug]);
  usePageTitle(hero.data ? `${hero.data.name} counters` : null);

  if (hero.loading || counters.loading || synergies.loading) {
    return <Spinner />;
  }
  const failure = hero.error ?? counters.error ?? synergies.error;
  if (failure || !hero.data || !counters.data || !synergies.data) {
    return failure ? <ErrorMessage failure={failure} /> : null;
  }

  const { counters: strongAgainst, counteredBy } = counters.data;
  const empty =
    strongAgainst.length + counteredBy.length + synergies.data.length === 0;

  return (
    <>
      <HeroSubpageHeader hero={hero.data} title="counters and synergies" />
      {empty && (
        <EmptyState>
          No counters or synergies have been added for {hero.data.name} yet.
        </EmptyState>
      )}
      {strongAgainst.length > 0 && (
        <section className="section">
          <h2>Strong against</h2>
          <RelatedHeroes heroes={strongAgainst} />
        </section>
      )}
      {counteredBy.length > 0 && (
        <section className="section">
          <h2>Struggles against</h2>
          <RelatedHeroes heroes={counteredBy} />
        </section>
      )}
      {synergies.data.length > 0 && (
        <section className="section">
          <h2>Works well with</h2>
          <RelatedHeroes heroes={synergies.data} />
        </section>
      )}
      {!empty && (
        <p className="muted footnote">
          Counters and synergies are curated recommendations, not statistics.
        </p>
      )}
    </>
  );
}
