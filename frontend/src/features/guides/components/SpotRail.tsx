import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MapVisual } from "../../../hooks/useCatalog";
import type { Guide } from "../../../types/api";
import { SpotCard } from "./SpotCard";
import "../guides.css";

interface SpotRailProps {
  guides: Guide[];
  showHero: boolean;
  showMap: boolean;
  heroPortraits: Record<string, string | null>;
  mapVisuals: Record<string, MapVisual>;
}

export function SpotRail({
  guides,
  showHero,
  showMap,
  heroPortraits,
  mapVisuals,
}: SpotRailProps) {
  const railRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const updateEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }
    setEdges({
      start: rail.scrollLeft <= 1,
      end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    if (railRef.current) {
      railRef.current.scrollLeft = 0;
    }
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges, guides]);

  function scrollRail(direction: 1 | -1) {
    const rail = railRef.current;
    if (rail) {
      rail.scrollBy({
        left: direction * rail.clientWidth * 0.8,
        behavior: "smooth",
      });
    }
  }

  return (
    <div className="spot-rail-wrap">
      {!edges.start && (
        <button
          type="button"
          className="spot-rail__arrow spot-rail__arrow--back"
          aria-label="Scroll back"
          onClick={() => scrollRail(-1)}
        >
          <ChevronLeft aria-hidden="true" size={22} />
        </button>
      )}
      <ul ref={railRef} className="spot-rail" onScroll={updateEdges}>
        {guides.map((guide) => (
          <li key={guide.id}>
            <SpotCard
              guide={guide}
              showHero={showHero}
              showMap={showMap}
              heroPortraits={heroPortraits}
              mapVisuals={mapVisuals}
            />
          </li>
        ))}
      </ul>
      {!edges.end && (
        <button
          type="button"
          className="spot-rail__arrow spot-rail__arrow--forward"
          aria-label="Scroll forward"
          onClick={() => scrollRail(1)}
        >
          <ChevronRight aria-hidden="true" size={22} />
        </button>
      )}
    </div>
  );
}
