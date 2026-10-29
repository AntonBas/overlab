import { Link } from "react-router-dom";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import type { GameMap } from "../../../types/api";
import { MAP_PLACEHOLDER_URL } from "../../../utils/modes";

export function MapCard({ map }: { map: GameMap }) {
  return (
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
}
