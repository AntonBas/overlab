import { Link } from "react-router-dom";
import { FavoriteButton } from "../../personal";
import { ModeIcon } from "../../../components/ui/ModeIcon";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import type { GameMap } from "../../../types/map";
import { MAP_MODE_LABELS } from "../../../utils/format";
import { MAP_PLACEHOLDER_URL } from "../../../utils/modes";

interface MapCardProps {
  map: GameMap;
  withFavorite?: boolean;
  to?: string;
  caption?: string;
}

export function MapCard({
  map,
  withFavorite = false,
  to = `/maps/${map.slug}`,
  caption,
}: MapCardProps) {
  const card = (
    <Link className="map-card" to={to}>
      <span className="map-card__image">
        <Thumbnail
          url={map.imageUrl ?? MAP_PLACEHOLDER_URL}
          width={480}
          height={300}
        />
      </span>
      {map.mode && (
        <span className="map-card__mode">
          <ModeIcon mode={map.mode} />
          {MAP_MODE_LABELS[map.mode]}
        </span>
      )}
      <span className="map-card__name">
        {map.name}
        {caption && <small className="map-card__caption">{caption}</small>}
      </span>
    </Link>
  );
  if (!withFavorite) {
    return card;
  }
  return (
    <div className="map-card-wrap">
      {card}
      <span className="map-card__favorite">
        <FavoriteButton compact kind="map" slug={map.slug} name={map.name} />
      </span>
    </div>
  );
}
