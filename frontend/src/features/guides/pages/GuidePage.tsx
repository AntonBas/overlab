import { useParams } from "react-router-dom";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { Spinner } from "../../../components/ui/Spinner";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import { useHeroPortraits, useMapVisuals } from "../../../hooks/useCatalog";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { MAP_PLACEHOLDER_URL } from "../../../utils/modes";
import { GuideEmbed } from "../components/GuideEmbed";
import { fetchGuide } from "../api/guidesApi";

export function GuidePage() {
  const { path = "" } = useParams();
  const guide = useFetch(() => fetchGuide(path), [path]);
  usePageTitle(guide.data?.title);
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
  const mapImage = data.mapSlug
    ? (mapVisuals[data.mapSlug]?.imageUrl ?? MAP_PLACEHOLDER_URL)
    : null;
  return (
    <article className="guide">
      <header className="guide__header">
        <h1>{data.title}</h1>
        <p className="guide__meta">
          <span className="guide__place">
            <HeroPortrait
              name={data.heroName}
              url={heroPortraits[data.heroSlug] ?? null}
              size={32}
            />
            {data.heroName}
          </span>
          {data.mapSlug && (
            <>
              <span className="muted">on</span>
              <span className="guide__place">
                <Thumbnail url={mapImage} width={56} height={32} />
                {data.mapName}
              </span>
            </>
          )}
        </p>
      </header>
      <GuideEmbed guide={data} />
      {data.description && (
        <p className="prose guide__description">{data.description}</p>
      )}
    </article>
  );
}
