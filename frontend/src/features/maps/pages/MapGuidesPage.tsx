import { Link, useParams } from "react-router-dom";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { ModeIcon } from "../../../components/ui/ModeIcon";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import { useFetch } from "../../../hooks/useFetch";
import { useNoIndex } from "../../../hooks/useNoIndex";
import { usePageDescription } from "../../../hooks/usePageDescription";
import { usePageTitle } from "../../../hooks/usePageTitle";
import {
  breadcrumbList,
  useStructuredData,
} from "../../../hooks/useStructuredData";
import { MAP_MODE_LABELS } from "../../../utils/format";
import { MAP_PLACEHOLDER_URL } from "../../../utils/modes";
import { fetchGuides, SpotsSection } from "../../guides";
import { MIN_GUIDES_FOR_LIST_PAGE } from "../../guides/constants";
import { fetchMap, fetchMaps } from "../api/mapsApi";
import { MapNavigation } from "../components/MapNavigation";

export function MapGuidesPage() {
  const { slug = "" } = useParams();
  const map = useFetch(() => fetchMap(slug), [slug]);
  const guides = useFetch(() => fetchGuides({ map: slug }), [slug]);
  const maps = useFetch(fetchMaps, []);
  const name = map.data?.name;
  useNoIndex(
    map.error?.status === 404 ||
      (guides.data !== null && guides.data.length < MIN_GUIDES_FOR_LIST_PAGE),
  );
  usePageTitle(name ? `${name} guides: spots, setups and tips` : undefined);
  usePageDescription(
    name
      ? `Overwatch ${name} video guides: spots, setups, ultimates and tips for every hero on this map.`
      : null,
  );
  useStructuredData(
    name
      ? breadcrumbList(
          [
            { name: "Overlab", path: "/" },
            { name: "Maps", path: "/maps" },
            { name, path: `/maps/${slug}` },
            { name: "Guides", path: `/maps/${slug}/guides` },
          ],
          window.location.origin,
        )
      : null,
  );

  if (map.loading || guides.loading) {
    return <Spinner page label="Loading guides" />;
  }
  const failure = map.error ?? guides.error;
  if (failure || !map.data || !guides.data) {
    return failure ? (
      <ErrorMessage
        failure={failure}
        onRetry={() => {
          map.reload();
          guides.reload();
        }}
      />
    ) : null;
  }
  const current = map.data;

  return (
    <>
      <nav className="guide__crumbs" aria-label="Breadcrumb">
        <Link to="/maps">Maps</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <Link to={`/maps/${current.slug}`}>{current.name}</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <Link to="/guides">Guides</Link>
      </nav>
      <PageHeader
        title={`${current.name} guides`}
        subtitle={
          current.mode ? (
            <>
              <ModeIcon mode={current.mode} /> {MAP_MODE_LABELS[current.mode]}.
              Short videos with positions, setups, ultimates and tips.
            </>
          ) : (
            "Short videos with positions, setups, ultimates and tips."
          )
        }
        image={
          <Thumbnail
            url={current.imageUrl ?? MAP_PLACEHOLDER_URL}
            width={96}
            height={64}
          />
        }
        actions={
          <Link className="button button--ghost" to={`/maps/${current.slug}`}>
            Full {current.name} page
          </Link>
        }
      />
      <SpotsSection
        title={`${current.name} guides`}
        guides={guides.data}
        groupBy="hero"
        expanded
        emptyMessage={`No guides for ${current.name} yet.`}
      />
      {maps.data && <MapNavigation current={current} maps={maps.data} />}
    </>
  );
}
