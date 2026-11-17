import clsx from "clsx";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { DeltaValue } from "../../../components/ui/DeltaValue";
import { ModeIcon } from "../../../components/ui/ModeIcon";
import { ShowMoreButton } from "../../../components/ui/ShowMoreButton";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import { useFetch } from "../../../hooks/useFetch";
import type { HeroMapStat } from "../../../types/stats";
import { MAP_MODE_LABELS, formatPercent } from "../../../utils/format";
import { MAP_PLACEHOLDER_URL } from "../../../utils/modes";
import { fetchMaps } from "../../maps";
import { mapPagePath } from "../utils/mapPagePath";
import { mapPicks, mapsByGain } from "../utils/mapPicks";

interface HeroMapPicksProps {
  heroName: string;
  maps: HeroMapStat[];
  linkSuffix: string;
}

const MAP_DELTA_TITLE =
  "Win rate on this map minus the hero's all-maps win rate, in percentage points";

type PickView = "best" | "worst";

const VIEW_LABELS: Record<PickView, string> = {
  best: "Best maps",
  worst: "Worst maps",
};

function MapMeta({ entry }: { entry: HeroMapStat }) {
  return (
    <>
      {entry.mode && (
        <span title={MAP_MODE_LABELS[entry.mode]}>
          <ModeIcon mode={entry.mode} />
          <span className="visually-hidden">
            {MAP_MODE_LABELS[entry.mode]}{" "}
          </span>
        </span>
      )}
      {entry.mapName}
    </>
  );
}

function MapStats({ entry }: { entry: HeroMapStat }) {
  return (
    <>
      {formatPercent(entry.winRate)} win &middot;{" "}
      {formatPercent(entry.pickRate)} pick
    </>
  );
}

function MapList({
  title,
  featuredLabel,
  worst,
  expanded,
  entries,
  linkSuffix,
  images,
  totalCount,
  onToggleExpanded,
}: {
  title: string;
  featuredLabel: string;
  worst: boolean;
  expanded: boolean;
  entries: HeroMapStat[];
  linkSuffix: string;
  images: Record<string, string | null>;
  totalCount: number | null;
  onToggleExpanded: () => void;
}) {
  if (entries.length === 0) {
    return null;
  }
  const [featured, ...others] = entries;
  const rest = expanded ? entries : others;
  const largestGain = Math.max(
    ...rest.map((entry) => Math.abs(entry.winRateDelta ?? 0)),
    0.1,
  );
  const featuredImage = images[featured.mapSlug ?? ""] ?? MAP_PLACEHOLDER_URL;
  return (
    <>
      <p className="highlight__label muted">{title}</p>
      <div className={clsx("map-picks", { "map-picks--expanded": expanded })}>
        {!expanded && (
          <Link
            className={clsx("map-featured", { "map-featured--worst": worst })}
            to={mapPagePath(featured.mapSlug ?? "", linkSuffix)}
            style={{ backgroundImage: `url(${featuredImage})` }}
          >
            <span className="map-featured__label">{featuredLabel}</span>
            <span className="map-featured__name">
              <MapMeta entry={featured} />
            </span>
            <span className="map-featured__numbers">
              <span className="map-featured__delta">
                <DeltaValue
                  value={featured.winRateDelta}
                  unit="%"
                  title={MAP_DELTA_TITLE}
                />
              </span>
              <span className="map-featured__stats">
                <MapStats entry={featured} />
              </span>
            </span>
          </Link>
        )}
        <div className="map-picks__side">
          {rest.length > 0 && (
            <ol className="map-picks__list" start={expanded ? 1 : 2}>
              {rest.map((entry) => (
                <li key={entry.mapSlug}>
                  <Link
                    className={clsx("map-pick", {
                      "map-pick--down": (entry.winRateDelta ?? 0) < 0,
                    })}
                    style={
                      {
                        "--delta-width": `${Math.max(
                          6,
                          (Math.abs(entry.winRateDelta ?? 0) / largestGain) *
                            100,
                        )}%`,
                      } as CSSProperties
                    }
                    to={mapPagePath(entry.mapSlug ?? "", linkSuffix)}
                  >
                    <span className="map-pick__thumbnail">
                      <Thumbnail
                        url={images[entry.mapSlug ?? ""] ?? MAP_PLACEHOLDER_URL}
                        width={64}
                        height={38}
                      />
                    </span>
                    <span className="map-pick__text">
                      <span className="map-pick__name">
                        <MapMeta entry={entry} />
                      </span>
                      <span className="map-pick__stats muted">
                        <MapStats entry={entry} />
                      </span>
                    </span>
                    <span className="map-pick__delta">
                      <DeltaValue
                        value={entry.winRateDelta}
                        unit="%"
                        title={MAP_DELTA_TITLE}
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
          {totalCount !== null && (
            <ShowMoreButton
              label="Show all maps"
              expandedLabel="Show fewer maps"
              expanded={expanded}
              onClick={onToggleExpanded}
            />
          )}
        </div>
      </div>
    </>
  );
}

export function HeroMapPicks({
  heroName,
  maps,
  linkSuffix,
}: HeroMapPicksProps) {
  const [view, setView] = useState<PickView>("best");
  const allMaps = useFetch(fetchMaps, []);
  const images = Object.fromEntries(
    (allMaps.data ?? []).map((map) => [map.slug, map.imageUrl]),
  );
  const [expanded, setExpanded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const wasExpanded = useRef(false);

  useLayoutEffect(() => {
    if (wasExpanded.current && !expanded) {
      sectionRef.current?.scrollIntoView({ block: "start" });
    }
    wasExpanded.current = expanded;
  }, [expanded]);
  const picks = mapPicks(maps);
  const best = view === "best";
  const ranked = mapsByGain(maps);
  const fullList = best ? ranked : [...ranked].reverse();
  const shortList = best ? picks.best : picks.worst;
  const canExpand = fullList.length > shortList.length;

  if (maps.length === 0) {
    return null;
  }
  return (
    <section
      ref={sectionRef}
      className="section hero-map-picks"
      aria-labelledby="hero-map-picks-heading"
    >
      <div className="section__heading">
        <div className="section__title">
          <h2 id="hero-map-picks-heading">
            {VIEW_LABELS[view]} for {heroName}
          </h2>
          <p className="muted section__description">
            Win and pick rate per map. The coloured number is the gap to the
            hero&apos;s all-maps win rate. Rare picks are weighted down.
          </p>
        </div>
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
        <section
          className="highlight"
          aria-label={best ? "Best maps" : "Weakest maps"}
        >
          <MapList
            title={
              best
                ? "Best compared with the hero's average"
                : "Weakest compared with the hero's average"
            }
            featuredLabel={best ? "Best map" : "Worst map"}
            worst={!best}
            expanded={expanded}
            entries={expanded ? fullList : shortList}
            linkSuffix={linkSuffix}
            images={images}
            totalCount={canExpand ? fullList.length : null}
            onToggleExpanded={() => setExpanded((current) => !current)}
          />
        </section>
      </div>
    </section>
  );
}
