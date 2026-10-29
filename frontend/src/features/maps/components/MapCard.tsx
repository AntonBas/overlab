import { Link } from "react-router-dom";
import { FavoriteButton } from "../../personal/components/FavoriteButton";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import type { GameMap } from "../../../types/api";
import { MAP_PLACEHOLDER_URL } from "../../../utils/modes";

interface MapCardProps {
  map: GameMap;
  withFavorite?: boolean;
}

export function MapCard({ map, withFavorite = false }: MapCardProps) {
  const card = (
    <Link className="map-card" to={`/maps/${map.slug}`}>
      <span className="map-card__image">
        <Thumbnail
          url={map.imageUrl ?? MAP_PLACEHOLDER_URL}
          width={480}
          height={300}
        />
      </span>
      <span className="map-card__name">{map.name}</span>
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
