import clsx from "clsx";
import { Play } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { ModeIcon } from "../../../components/ui/ModeIcon";
import type { MapVisual } from "../../../hooks/useCatalog";
import type { Guide } from "../../../types/guide";
import { formatSeconds } from "../../../utils/format";
import { AbilityText } from "../../abilities";
import {
  GUIDE_KIND_ICONS,
  GUIDE_KIND_LABELS,
  GUIDE_SIDE_LABELS,
} from "../labels";

interface SpotCardProps {
  guide: Guide;
  showHero?: boolean;
  showMap?: boolean;
  heroPortraits?: Record<string, string | null>;
  mapVisuals?: Record<string, MapVisual>;
}

const NO_HERO_PORTRAITS: Record<string, string | null> = {};
const NO_MAP_VISUALS: Record<string, MapVisual> = {};

export function SpotCard({
  guide,
  showHero = false,
  showMap = false,
  heroPortraits = NO_HERO_PORTRAITS,
  mapVisuals = NO_MAP_VISUALS,
}: SpotCardProps) {
  const [playing, setPlaying] = useState(false);
  const mapMode = guide.mapSlug ? mapVisuals[guide.mapSlug]?.mode : null;
  const hasPlace = showHero || showMap;

  const KindIcon = GUIDE_KIND_ICONS[guide.kind];
  const caption = (
    <>
      <h3>
        <Link to={`/guides/${guide.path}`}>{guide.title}</Link>
      </h3>
      {(hasPlace || guide.abilitySlug) && (
        <p className="spot-card__place">
          {showHero && (
            <span className="place-icon">
              <HeroPortrait
                name={guide.heroName}
                url={heroPortraits[guide.heroSlug] ?? null}
                size={16}
              />
              {guide.heroName}
            </span>
          )}
          {showMap && (
            <span className="place-icon">
              {mapMode && <ModeIcon mode={mapMode} />}
              {guide.mapName ?? "Any map"}
            </span>
          )}
          {guide.abilitySlug && (
            <span className="spot-card__ability">
              <AbilityText
                text={`[[${guide.heroSlug}/${guide.abilitySlug}]]`}
              />
            </span>
          )}
        </p>
      )}
    </>
  );

  return (
    <article className="spot-card">
      <div className="spot-card__media">
        {playing ? (
          <iframe
            src={`${guide.embedUrl}&autoplay=1`}
            title={guide.title}
            allow="autoplay; accelerometer; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="spot-card__play"
            aria-label={`Play ${guide.title}`}
            onClick={() => setPlaying(true)}
          >
            <img
              src={`https://i.ytimg.com/vi/${guide.youtubeId}/mqdefault.jpg`}
              alt=""
              loading="lazy"
              decoding="async"
            />
            <span className="spot-card__icon" aria-hidden="true">
              <Play size={22} fill="currentColor" />
            </span>
            {guide.endSeconds !== null && (
              <span className="spot-card__length">
                {formatSeconds(guide.endSeconds - guide.startSeconds)}
              </span>
            )}
          </button>
        )}
        {!playing && (
          <>
            <span className="spot-card__chips">
              <span
                className={clsx(
                  "tag",
                  "spot-card__kind",
                  `tag--kind-${guide.kind.toLowerCase()}`,
                )}
              >
                <KindIcon size={12} aria-hidden="true" />
                {GUIDE_KIND_LABELS[guide.kind]}
              </span>
              {guide.side !== "BOTH" && (
                <span
                  className={clsx(
                    "tag",
                    "spot-card__kind",
                    `tag--side-${guide.side.toLowerCase()}`,
                  )}
                >
                  {GUIDE_SIDE_LABELS[guide.side]}
                </span>
              )}
            </span>
            <div className="spot-card__overlay">{caption}</div>
          </>
        )}
      </div>
      {playing && <div className="spot-card__caption">{caption}</div>}
    </article>
  );
}
