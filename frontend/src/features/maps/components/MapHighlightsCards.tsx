import { Link } from "react-router-dom";
import { DeltaValue } from "../../../components/ui/DeltaValue";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import type { HeroStat } from "../../../types/api";
import { mapHighlights } from "../utils/highlights";

interface MapHighlightsCardsProps {
  mapSlug: string;
  heroes: HeroStat[];
  linkSuffix: string;
}

function HighlightList({
  title,
  heroes,
  mapSlug,
  linkSuffix,
}: {
  title: string;
  heroes: HeroStat[];
  mapSlug: string;
  linkSuffix: string;
}) {
  return (
    <section className="highlight" aria-label={title}>
      <h3>{title}</h3>
      <ol className="highlight__list">
        {heroes.map((hero) => (
          <li key={hero.heroSlug}>
            <Link
              className="highlight__hero"
              to={`/maps/${mapSlug}/${hero.heroSlug}${linkSuffix}`}
            >
              <HeroPortrait
                name={hero.heroName}
                url={hero.portraitUrl}
                size={32}
              />
              <span className="highlight__name">{hero.heroName}</span>
              <DeltaValue value={hero.winRateDelta} />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function MapHighlightsCards({
  mapSlug,
  heroes,
  linkSuffix,
}: MapHighlightsCardsProps) {
  const { best, worst } = mapHighlights(heroes);
  if (best.length === 0 && worst.length === 0) {
    return null;
  }
  return (
    <div className="highlights">
      {best.length > 0 && (
        <HighlightList
          title="Over-performing on this map"
          heroes={best}
          mapSlug={mapSlug}
          linkSuffix={linkSuffix}
        />
      )}
      {worst.length > 0 && (
        <HighlightList
          title="Under-performing on this map"
          heroes={worst}
          mapSlug={mapSlug}
          linkSuffix={linkSuffix}
        />
      )}
    </div>
  );
}
