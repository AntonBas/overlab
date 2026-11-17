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
import { fetchPerks } from "../api/perksApi";
import { PerkList } from "../components/PerkList";

export function HeroPerksPage() {
  const { slug = "" } = useParams();
  const hero = useFetch(() => fetchHero(slug), [slug]);
  const perks = useFetch(() => fetchPerks(slug), [slug]);
  const heroes = useFetch(fetchHeroes, []);
  const name = hero.data?.name;
  useNoIndex(hero.error?.status === 404);
  usePageTitle(name ? `${name} perks: best Minor and Major perks` : undefined);
  usePageDescription(
    name
      ? `Best Overwatch ${name} perks: every Minor and Major perk with a description, a rating and why it is worth taking.`
      : null,
  );
  useStructuredData(
    name
      ? breadcrumbList(
          [
            { name: "Overlab", path: "/" },
            { name: "Heroes", path: "/heroes" },
            { name, path: `/heroes/${slug}` },
            { name: "Perks", path: `/heroes/${slug}/perks` },
          ],
          window.location.origin,
        )
      : null,
  );

  if (hero.loading || perks.loading) {
    return <Spinner page />;
  }
  const failure = hero.error ?? perks.error;
  if (failure || !hero.data || !perks.data) {
    return failure ? (
      <ErrorMessage
        failure={failure}
        onRetry={() => {
          hero.reload();
          perks.reload();
        }}
      />
    ) : null;
  }
  const current = hero.data;

  return (
    <HeroSubPageLayout
      hero={current}
      allHeroes={heroes.data ?? []}
      section="Perks"
      allHref="/perks"
      allLabel="All perks"
      title={`${current.name} perks`}
      subtitle="Recommended perks are the default pick. Optional ones depend on the situation."
    >
      {perks.data.length === 0 ? (
        <EmptyState>No perks for {current.name} yet.</EmptyState>
      ) : (
        <PerkList perks={perks.data} />
      )}
    </HeroSubPageLayout>
  );
}
