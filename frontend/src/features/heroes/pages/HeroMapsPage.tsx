import { useParams } from "react-router-dom";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { QueueToggle } from "../../../components/ui/QueueToggle";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { fetchHeroMapStats } from "../../stats/api/statsApi";
import { HeroMapPicks } from "../components/profile/HeroMapPicks";
import { HeroSubpageHeader } from "../components/profile/HeroSubpageHeader";
import { useHeroQueue } from "../hooks/useHeroQueue";
import { useHeroSubpage } from "../hooks/useHeroSubpage";
import { heroStatsSentence } from "../utils/heroSeo";

export function HeroMapsPage() {
  const { slug = "" } = useParams();
  const { queue, linkSuffix, changeQueue } = useHeroQueue();
  const stats = useFetch(
    () =>
      fetchHeroMapStats(slug, {
        queue,
        tier: "ALL",
        platform: "PC",
        region: "EUROPE",
      }),
    [slug, queue],
    { keepPrevious: true },
  );
  const hasMaps = stats.data ? stats.data.maps.length > 0 : null;
  const hero = useHeroSubpage(slug, "maps", hasMaps);

  if (hero.loading || (stats.loading && !stats.data)) {
    return <Spinner page />;
  }
  if (hero.error || !hero.data) {
    return hero.error ? (
      <ErrorMessage failure={hero.error} onRetry={hero.reload} />
    ) : null;
  }
  const name = hero.data.name;
  const summary = heroStatsSentence(
    name,
    stats.data?.overall ?? null,
    queue === "COMPETITIVE",
  );

  return (
    <>
      <HeroSubpageHeader
        hero={hero.data}
        section="maps"
        linkSuffix={linkSuffix}
        intro={`${name} win rate and pick rate on every Overwatch 2 map. ${summary ?? ""}`.trim()}
        actions={<QueueToggle value={queue} onChange={changeQueue} />}
      />
      {stats.error &&
        (stats.error.status === 404 ? (
          <EmptyState>
            No statistics have been collected for {name} yet.
          </EmptyState>
        ) : (
          <ErrorMessage failure={stats.error} onRetry={stats.reload} />
        ))}
      {stats.data && stats.data.maps.length > 0 && (
        <HeroMapPicks
          heroName={name}
          maps={stats.data.maps}
          linkSuffix={linkSuffix}
        />
      )}
      {stats.data && stats.data.maps.length === 0 && (
        <EmptyState>No map statistics have been collected yet.</EmptyState>
      )}
    </>
  );
}
