import { useCallback, useEffect, useRef, useState } from "react";
import type { GameMap } from "../../../types/map";
import { MAP_MODE_LABELS } from "../../../utils/format";
import { MapCard } from "./MapCard";
import { preferredScrollBehavior } from "../../../utils/motion";

interface MapNavigationProps {
  current: GameMap;
  maps: GameMap[];
}

const SCROLL_TOLERANCE_PX = 1;

export function MapNavigation({ current, maps }: MapNavigationProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const sameMode = current.mode
    ? maps.filter(
        (map) => map.mode === current.mode && map.slug !== current.slug,
      )
    : [];

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    setCanScrollBack(track.scrollLeft > SCROLL_TOLERANCE_PX);
    setCanScrollForward(
      track.scrollLeft + track.clientWidth <
        track.scrollWidth - SCROLL_TOLERANCE_PX,
    );
  }, []);

  useEffect(() => {
    updateScrollState();
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(track);
    return () => observer.disconnect();
  }, [updateScrollState, sameMode.length]);

  function scrollBy(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    track.scrollBy({
      left: direction * track.clientWidth,
      behavior: preferredScrollBehavior(),
    });
  }

  if (sameMode.length === 0 || !current.mode) {
    return null;
  }

  return (
    <section className="section">
      <h2>More {MAP_MODE_LABELS[current.mode]} maps</h2>
      <div className="map-carousel">
        {canScrollBack && (
          <button
            type="button"
            className="map-carousel__button map-carousel__button--back"
            aria-label="Previous maps"
            onClick={() => scrollBy(-1)}
          >
            &lsaquo;
          </button>
        )}
        <ul
          ref={trackRef}
          className="map-carousel__track"
          onScroll={updateScrollState}
        >
          {sameMode.map((map) => (
            <li key={map.slug} className="map-carousel__item">
              <MapCard map={map} />
            </li>
          ))}
        </ul>
        {canScrollForward && (
          <button
            type="button"
            className="map-carousel__button map-carousel__button--forward"
            aria-label="Next maps"
            onClick={() => scrollBy(1)}
          >
            &rsaquo;
          </button>
        )}
      </div>
    </section>
  );
}
