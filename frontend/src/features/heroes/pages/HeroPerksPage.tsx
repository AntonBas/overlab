import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { fetchPerks } from "../api/heroesApi";
import { HeroSubpageHeader } from "../components/profile/HeroSubpageHeader";
import { PerkList } from "../components/profile/PerkList";
import { useHeroSubpage } from "../hooks/useHeroSubpage";

export function HeroPerksPage() {
  const { slug = "" } = useParams();
  const perks = useFetch(() => fetchPerks(slug), [slug]);
  const hasPerks = perks.data ? perks.data.length > 0 : null;
  const hero = useHeroSubpage(slug, "perks", hasPerks);

  if (hero.loading || perks.loading) {
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
        section="perks"
        intro={`${name} has Minor and Major perks in Overwatch 2. Each perk below is marked by Overlab as recommended, optional or one to avoid.`}
      />
      {perks.error && (
        <ErrorMessage failure={perks.error} onRetry={perks.reload} />
      )}
      {perks.data && perks.data.length > 0 && <PerkList perks={perks.data} />}
      {perks.data && perks.data.length === 0 && (
        <EmptyState>No perks have been added for {name} yet.</EmptyState>
      )}
      <p className="muted footnote">
        Perk recommendations are curated by Overlab, not statistics. See the{" "}
        <Link to="/perks">perks of every hero</Link>.
      </p>
    </>
  );
}
