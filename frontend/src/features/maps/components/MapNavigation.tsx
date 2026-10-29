import { Link } from "react-router-dom";
import type { GameMap } from "../../../types/api";
import { MAP_MODE_LABELS } from "../../../utils/format";
import { MapCard } from "./MapCard";

interface MapNavigationProps {
  current: GameMap;
  maps: GameMap[];
}

const SAME_MODE_LIMIT = 4;

export function MapNavigation({ current, maps }: MapNavigationProps) {
  const index = maps.findIndex((map) => map.slug === current.slug);
  if (index === -1) {
    return null;
  }
  const previous = maps[(index - 1 + maps.length) % maps.length];
  const next = maps[(index + 1) % maps.length];
  const sameMode = current.mode
    ? maps
        .filter((map) => map.mode === current.mode && map.slug !== current.slug)
        .slice(0, SAME_MODE_LIMIT)
    : [];

  return (
    <>
      {sameMode.length > 0 && current.mode && (
        <section className="section">
          <h2>More {MAP_MODE_LABELS[current.mode]} maps</h2>
          <ul className="map-grid map-grid--compact">
            {sameMode.map((map) => (
              <li key={map.slug}>
                <MapCard map={map} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {maps.length > 1 && (
        <nav className="map-pager" aria-label="Other maps">
          <Link to={`/maps/${previous.slug}`} rel="prev">
            &larr; {previous.name}
          </Link>
          <Link to={`/maps/${next.slug}`} rel="next">
            {next.name} &rarr;
          </Link>
        </nav>
      )}
    </>
  );
}
