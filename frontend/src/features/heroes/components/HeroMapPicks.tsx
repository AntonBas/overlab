import clsx from "clsx";
import { useState } from "react";
import { Link } from "react-router-dom";
import { DeltaValue } from "../../../components/ui/DeltaValue";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import { useFetch } from "../../../hooks/useFetch";
import type { HeroMapStat } from "../../../types/api";
import { formatPercent } from "../../../utils/format";
import { MAP_PLACEHOLDER_URL } from "../../../utils/modes";
import { fetchMaps } from "../../maps/api/mapsApi";
import { heroOnMapPath } from "../utils/heroOnMapPath";
import { mapPicks } from "../utils/mapPicks";

interface HeroMapPicksProps {
  heroSlug: string;
  heroName: string;
  maps: HeroMapStat[];
  linkSuffix: string;
}

type PickView = "best" | "worst";

const VIEW_LABELS: Record<PickView, string> = {
  best: "Best maps",
  worst: "Worst maps",
};

function MapList({
  title,
  entries,
  heroSlug,
  linkSuffix,
  images,
}: {
  title: string;
  entries: HeroMapStat[];
  heroSlug: string;
  linkSuffix: string;
  images: Record<string, string | null>;
}) {
  if (entries.length === 0) {
    return null;
  }
  return (
    <>
      <p className="highlight__label muted">{title}</p>
      <ol className="highlight__list">
        {entries.map((entry) => (
          <li key={entry.mapSlug}>
            <Link
              className="highlight__hero highlight__hero--map"
              to={heroOnMapPath(heroSlug, entry.mapSlug ?? "", linkSuffix)}
            >
              <span className="highlight__portrait">
                <Thumbnail
                  url={images[entry.mapSlug ?? ""] ?? MAP_PLACEHOLDER_URL}
                  width={64}
                  height={36}
                />
              </span>
              <span className="highlight__name">{entry.mapName}</span>
              <span className="highlight__delta">
                <DeltaValue value={entry.winRateDelta} />
              </span>
              <span className="highlight__stats muted">
                {formatPercent(entry.winRate)} win &middot;{" "}
                {formatPercent(entry.pickRate)} pick
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}

export function HeroMapPicks({
  heroSlug,
  heroName,
  maps,
  linkSuffix,
}: HeroMapPicksProps) {
  const [view, setView] = useState<PickView>("best");
  const allMaps = useFetch(fetchMaps, []);
  const images = Object.fromEntries(
    (allMaps.data ?? []).map((map) => [map.slug, map.imageUrl]),
  );
  const picks = mapPicks(maps);
  const best = view === "best";

  if (maps.length === 0) {
    return null;
  }
  return (
    <section className="section" aria-labelledby="hero-map-picks-heading">
      <div className="section__heading">
        <h2 id="hero-map-picks-heading">
          {VIEW_LABELS[view]} for {heroName}
        </h2>
        <div className="segmented" role="group" aria-label="Maps to show">
          {(Object.keys(VIEW_LABELS) as PickView[]).map((value) => (
            <button
              key={value}
              type="button"
              className={clsx("segmented__item", {
                "segmented__item--active": view === value,
              })}
              aria-pressed={view === value}
              onClick={() => setView(value)}
            >
              {VIEW_LABELS[value]}
            </button>
          ))}
        </div>
      </div>
      <div className="highlights">
        <section className="highlight" aria-label="by gain">
          <MapList
            title={best ? "Biggest gain on the map" : "Biggest drop on the map"}
            entries={best ? picks.gainers : picks.droppers}
            heroSlug={heroSlug}
            linkSuffix={linkSuffix}
            images={images}
          />
        </section>
      </div>
      <p className="muted footnote">
        Each map shows the win rate of {heroName} there, how often the hero is
        picked and, as the coloured number, how much the win rate on that map
        differs from the all-maps win rate. The list is weighted by pick rate so
        rare picks do not top it by chance.
      </p>
    </section>
  );
}
