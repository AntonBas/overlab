import { Link, useParams } from "react-router-dom";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { ModeIcon } from "../../../components/ui/ModeIcon";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useHeroPortraits, useMapVisuals } from "../../../hooks/useCatalog";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
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
  const mapMode = data.mapSlug
    ? (mapVisuals[data.mapSlug]?.mode ?? null)
    : null;
  return (
    <>
      <PageHeader
        title={data.title}
        subtitle={
          <>
            <span className="place-icon">
              <HeroPortrait
                name={data.heroName}
                url={heroPortraits[data.heroSlug] ?? null}
                size={24}
              />
              <Link to={`/heroes/${data.heroSlug}`}>{data.heroName}</Link>
            </span>
            {data.mapSlug && (
              <>
                {" on "}
                <span className="place-icon">
                  {mapMode && <ModeIcon mode={mapMode} />}
                  <Link to={`/maps/${data.mapSlug}`}>{data.mapName}</Link>
                </span>
              </>
            )}
          </>
        }
      />
      <GuideEmbed guide={data} />
      {data.description && <p className="prose">{data.description}</p>}
    </>
  );
}
