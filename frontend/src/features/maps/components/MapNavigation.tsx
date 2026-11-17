import type { GameMap } from "../../../types/map";
import { Carousel } from "../../../components/ui/Carousel";
import { MAP_MODE_LABELS } from "../../../utils/format";
import { MapCard } from "./MapCard";

interface MapNavigationProps {
  current: GameMap;
  maps: GameMap[];
}

const MAPS_PER_VIEW = 4;

export function MapNavigation({ current, maps }: MapNavigationProps) {
  const sameMode = current.mode
    ? maps.filter(
        (map) => map.mode === current.mode && map.slug !== current.slug,
      )
    : [];

  if (sameMode.length === 0 || !current.mode) {
    return null;
  }

  return (
    <section className="section">
      <h2>More {MAP_MODE_LABELS[current.mode]} maps</h2>
      <Carousel
        items={sameMode.map((map) => ({
          key: map.slug,
          content: <MapCard map={map} />,
        }))}
        itemsPerView={MAPS_PER_VIEW}
        previousLabel="Previous maps"
        nextLabel="Next maps"
      />
    </section>
  );
}
