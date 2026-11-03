import clsx from "clsx";
import { Play } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Guide } from "../../../types/api";
import { formatSeconds } from "../../../utils/format";
import { AbilityText } from "../../heroes/components/AbilityText";
import { GUIDE_KIND_LABELS, GUIDE_SIDE_LABELS } from "../labels";

interface SpotCardProps {
  guide: Guide;
  showHero?: boolean;
  showMap?: boolean;
}

export function SpotCard({
  guide,
  showHero = false,
  showMap = false,
}: SpotCardProps) {
  const [playing, setPlaying] = useState(false);
  const place = [
    showHero ? guide.heroName : null,
    showMap ? (guide.mapName ?? "Any map") : null,
  ].filter(Boolean);

  return (
    <article className="spot-card">
      <div className="spot-card__media">
        {playing ? (
          <iframe
            src={`${guide.embedUrl}&autoplay=1`}
            title={guide.title}
            allow="autoplay; accelerometer; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
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
      </div>
      <div className="spot-card__body">
        <div className="spot-card__tags">
          <span
            className={clsx("tag", `tag--kind-${guide.kind.toLowerCase()}`)}
          >
            {GUIDE_KIND_LABELS[guide.kind]}
          </span>
          {guide.side !== "BOTH" && (
            <span
              className={clsx("tag", `tag--side-${guide.side.toLowerCase()}`)}
            >
              {GUIDE_SIDE_LABELS[guide.side]}
            </span>
          )}
          {guide.abilitySlug && (
            <span className="spot-card__ability">
              <AbilityText
                text={`[[${guide.heroSlug}/${guide.abilitySlug}]]`}
              />
            </span>
          )}
        </div>
        <h3>
          <Link to={`/guides/${guide.path}`}>{guide.title}</Link>
        </h3>
        {place.length > 0 && <p className="muted">{place.join(" on ")}</p>}
        {guide.description && (
          <p className="muted spot-card__description">{guide.description}</p>
        )}
      </div>
    </article>
  );
}
