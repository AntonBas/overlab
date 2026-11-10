import { useFetch } from "../../../hooks/useFetch";
import { usePageDescription } from "../../../hooks/usePageDescription";
import { useNoIndex } from "../../../hooks/useNoIndex";
import { usePageTitle } from "../../../hooks/usePageTitle";
import {
  breadcrumbList,
  useStructuredData,
} from "../../../hooks/useStructuredData";
import { fetchHero } from "../api/heroesApi";
import { SECTION_COPY, type HeroSection } from "../utils/heroSeo";

export function useHeroSubpage(
  slug: string,
  section: HeroSection,
  hasContent: boolean | null,
) {
  const hero = useFetch(() => fetchHero(slug), [slug]);
  const name = hero.data?.name;
  const copy = SECTION_COPY[section];

  usePageTitle(name ? copy.title(name) : null);
  usePageDescription(name ? copy.description(name) : null);
  useNoIndex(hasContent === false);
  useStructuredData(
    name
      ? breadcrumbList(
          [
            { name: "Overlab", path: "/" },
            { name: "Heroes", path: "/heroes" },
            { name, path: `/heroes/${slug}` },
            { name: copy.label, path: `/heroes/${slug}/${section}` },
          ],
          window.location.origin,
        )
      : null,
  );
  return hero;
}
