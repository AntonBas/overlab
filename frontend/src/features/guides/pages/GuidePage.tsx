import clsx from "clsx";
import { Link, Navigate, useParams } from "react-router-dom";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { Spinner } from "../../../components/ui/Spinner";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import { useHeroPortraits, useMapVisuals } from "../../../hooks/useCatalog";
import { useFetch } from "../../../hooks/useFetch";
import { useNoIndex } from "../../../hooks/useNoIndex";
import { usePageDescription } from "../../../hooks/usePageDescription";
import { usePageTitle } from "../../../hooks/usePageTitle";
import {
  breadcrumbList,
  useStructuredData,
} from "../../../hooks/useStructuredData";
import { MAP_PLACEHOLDER_URL } from "../../../utils/modes";
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
    return <Spinner />;
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
  const mapImage = data.mapSlug
    ? (mapVisuals[data.mapSlug]?.imageUrl ?? MAP_PLACEHOLDER_URL)
    : null;
  const KindIcon = GUIDE_KIND_ICONS[data.kind];
  const moreSpots = (heroGuides.data ?? [])
    .filter((other) => other.id !== data.id)
    .slice(0, MORE_SPOTS);
  return (
    <article className="guide">
      <nav className="guide__crumbs" aria-label="Breadcrumb">
        <Link to="/heroes">Heroes</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <Link className="guide__crumb" to={`/heroes/${data.heroSlug}`}>
          <HeroPortrait
            name={data.heroName}
            url={heroPortraits[data.heroSlug] ?? null}
            size={20}
          />
          {data.heroName}
        </Link>
        {data.mapSlug && (
          <>
            <span aria-hidden="true">&rsaquo;</span>
            <Link className="guide__crumb" to={`/maps/${data.mapSlug}`}>
              <Thumbnail url={mapImage} width={24} height={24} />
              {data.mapName}
            </Link>
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
            <Link to={`/heroes/${data.heroSlug}#spots`}>All spots</Link>
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
