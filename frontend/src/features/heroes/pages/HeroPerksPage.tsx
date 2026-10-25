import { useParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { fetchHero, fetchPerks } from "../api/heroesApi";
import { HeroSubpageHeader } from "../components/HeroSubpageHeader";
import { PerkList } from "../components/PerkList";

export function HeroPerksPage() {
  const { slug = "" } = useParams();
  const hero = useFetch(() => fetchHero(slug), [slug]);
  const perks = useFetch(() => fetchPerks(slug), [slug]);
  usePageTitle(hero.data ? `${hero.data.name} perks` : null);

  if (hero.loading || perks.loading) {
    return <Spinner />;
  }
  const failure = hero.error ?? perks.error;
  if (failure || !hero.data || !perks.data) {
    return failure ? <ErrorMessage failure={failure} /> : null;
  }

  return (
    <>
      <HeroSubpageHeader hero={hero.data} title="perks" />
      {perks.data.length === 0 ? (
        <EmptyState>
          No perks have been added for {hero.data.name} yet.
        </EmptyState>
      ) : (
        <PerkList perks={perks.data} />
      )}
    </>
  );
}
