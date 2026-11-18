import { useParams } from "react-router-dom";
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
import { fetchGuides } from "../api/guidesApi";
import { MIN_GUIDES_FOR_LIST_PAGE } from "../constants";
import { SpotsSection } from "../components/SpotsSection";

export function HeroGuidesPage() {
  const { slug = "" } = useParams();
  const hero = useFetch(() => fetchHero(slug), [slug]);
  const guides = useFetch(() => fetchGuides({ hero: slug }), [slug]);
  const heroes = useFetch(fetchHeroes, []);
  const name = hero.data?.name;
  useNoIndex(
    hero.error?.status === 404 ||
      (guides.data !== null && guides.data.length < MIN_GUIDES_FOR_LIST_PAGE),
  );
  usePageTitle(name ? `${name} guides: spots, setups and tips` : undefined);
  usePageDescription(
    name
      ? `Overwatch ${name} video guides: spots, setups, ultimates and tips for every map.`
      : null,
  );
  useStructuredData(
    name
      ? breadcrumbList(
          [
            { name: "Overlab", path: "/" },
            { name: "Heroes", path: "/heroes" },
            { name, path: `/heroes/${slug}` },
            { name: "Guides", path: `/heroes/${slug}/guides` },
          ],
          window.location.origin,
        )
      : null,
  );

  if (hero.loading || guides.loading) {
    return <ListSkeleton kind="detail" label="Loading guides" />;
  }
  const failure = hero.error ?? guides.error;
  if (failure || !hero.data || !guides.data) {
    return failure ? (
      <ErrorMessage
        failure={failure}
        onRetry={() => {
          hero.reload();
          guides.reload();
        }}
      />
    ) : null;
  }
  const current = hero.data;

  return (
    <HeroSubPageLayout
      hero={current}
      allHeroes={heroes.data ?? []}
      section="Guides"
      allHref="/guides"
      allLabel="All guides"
      title={`${current.name} guides`}
      subtitle="Short videos with positions, setups, ultimates and tips."
    >
      <SpotsSection
        title={`${current.name} guides`}
        guides={guides.data}
        groupBy="map"
        expanded
        emptyMessage={`No guides for ${current.name} yet.`}
      />
    </HeroSubPageLayout>
  );
}
