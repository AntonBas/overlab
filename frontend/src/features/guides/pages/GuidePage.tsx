import { SectionLink } from "../../../components/ui/SectionLink";
import clsx from "clsx";
import { Link, Navigate, useParams } from "react-router-dom";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { ListSkeleton } from "../../../components/ui/ListSkeleton";
import { useHeroPortraits, useMapVisuals } from "../../../hooks/useCatalog";
import { useFetch } from "../../../hooks/useFetch";
import { useNoIndex } from "../../../hooks/useNoIndex";
import { usePageDescription } from "../../../hooks/usePageDescription";
import { usePageTitle } from "../../../hooks/usePageTitle";
import {
  breadcrumbList,
  useStructuredData,
} from "../../../hooks/useStructuredData";
import { GuideEmbed } from "../components/GuideEmbed";
import { fetchGuide, fetchGuides } from "../api/guidesApi";
import { SpotCard } from "../components/SpotCard";
import {
  GUIDE_KIND_ICONS,
  GUIDE_KIND_LABELS,
  GUIDE_SIDE_LABELS,
} from "../labels";

const MORE_SPOTS = 3;

export function GuidePage() {
  const { path = "" } = useParams();
  const guide = useFetch(() => fetchGuide(path), [path]);
  useNoIndex(guide.error?.status === 404);
  usePageTitle(guide.data?.title);
  usePageDescription(
    guide.data
      ? `${guide.data.title}: a short ${guide.data.heroName} video guide${guide.data.mapName ? ` for ${guide.data.mapName}` : ""}.`
      : null,
  );
  useStructuredData(
    guide.data
      ? breadcrumbList(
          [
            { name: "Overlab", path: "/" },
            { name: "Heroes", path: "/heroes" },
            {
              name: guide.data.heroName,
              path: `/heroes/${guide.data.heroSlug}`,
            },
            { name: guide.data.title, path: `/guides/${guide.data.path}` },
          ],
          window.location.origin,
        )
      : null,
  );
  useStructuredData(
    guide.data
      ? {
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: guide.data.title,
          description: guide.data.description || guide.data.title,
          thumbnailUrl: `https://i.ytimg.com/vi/${guide.data.youtubeId}/hqdefault.jpg`,
          embedUrl: guide.data.embedUrl,
          uploadDate: guide.data.createdAt,
          url: `${window.location.origin}/guides/${guide.data.path}`,
        }
      : null,
  );
  const heroSlug = guide.data?.heroSlug;
  const heroGuides = useFetch(
    () => (heroSlug ? fetchGuides({ hero: heroSlug }) : Promise.resolve([])),
    [heroSlug],
  );
  const heroPortraits = useHeroPortraits();
  const mapVisuals = useMapVisuals();

  if (guide.loading) {
    return <ListSkeleton kind="detail" label="Loading guide" />;
  }
  if (guide.error || !guide.data) {
    return guide.error ? (
      <ErrorMessage failure={guide.error} onRetry={guide.reload} />
    ) : null;
  }
  const data = guide.data;
  if (data.path !== path) {
    return <Navigate replace to={`/guides/${data.path}`} />;
  }
  const KindIcon = GUIDE_KIND_ICONS[data.kind];
  const moreSpots = (heroGuides.data ?? [])
    .filter((other) => other.id !== data.id)
    .slice(0, MORE_SPOTS);
  return (
    <article className="guide">
      <nav className="guide__crumbs" aria-label="Breadcrumb">
        <Link to="/heroes">Heroes</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <Link to={`/heroes/${data.heroSlug}`}>{data.heroName}</Link>
        {data.mapSlug && (
          <>
            <span aria-hidden="true">&rsaquo;</span>
            <Link to={`/maps/${data.mapSlug}`}>{data.mapName}</Link>
          </>
        )}
      </nav>
      <header className="guide__header">
        <h1>{data.title}</h1>
        <p className="guide__meta">
          <span
            className={clsx(
              "tag",
              "guide__kind",
              `tag--kind-${data.kind.toLowerCase()}`,
            )}
          >
            <KindIcon size={14} aria-hidden="true" />
            {GUIDE_KIND_LABELS[data.kind]}
          </span>
          {data.side !== "BOTH" && (
            <span
              className={clsx("tag", `tag--side-${data.side.toLowerCase()}`)}
            >
              {GUIDE_SIDE_LABELS[data.side]}
            </span>
          )}
        </p>
      </header>
      <GuideEmbed guide={data} />
      {data.description && (
        <p className="prose guide__description">{data.description}</p>
      )}
      {moreSpots.length > 0 && (
        <section className="section" aria-labelledby="guide-more-heading">
          <div className="section__heading">
            <h2 id="guide-more-heading">More spots for {data.heroName}</h2>
            <SectionLink to={`/heroes/${data.heroSlug}/guides`}>
              All spots
            </SectionLink>
          </div>
          <ul className="spot-grid">
            {moreSpots.map((other) => (
              <li key={other.id}>
                <SpotCard
                  guide={other}
                  showMap
                  heroPortraits={heroPortraits}
                  mapVisuals={mapVisuals}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
