import { Link, useParams } from "react-router-dom";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { GuideEmbed } from "../components/GuideEmbed";
import { fetchGuide } from "../api/guidesApi";

export function GuidePage() {
  const { path = "" } = useParams();
  const guide = useFetch(() => fetchGuide(path), [path]);
  usePageTitle(guide.data?.title);

  if (guide.loading) {
    return <Spinner />;
  }
  if (guide.error || !guide.data) {
    return guide.error ? (
      <ErrorMessage failure={guide.error} onRetry={guide.reload} />
    ) : null;
  }
  const data = guide.data;
  return (
    <>
      <PageHeader
        title={data.title}
        subtitle={
          <>
            <Link to={`/heroes/${data.heroSlug}`}>{data.heroName}</Link>
            {data.mapSlug && (
              <>
                {" on "}
                <Link to={`/maps/${data.mapSlug}`}>{data.mapName}</Link>
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
