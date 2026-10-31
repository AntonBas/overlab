import clsx from "clsx";
import { useState } from "react";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { ModeIcon } from "../../../components/ui/ModeIcon";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import type { GameMap, MapMode } from "../../../types/api";
import { MAP_MODE_LABELS } from "../../../utils/format";
import { matchesName } from "../../../utils/search";
import { FavoritesFilterButton } from "../../personal/components/FavoritesFilterButton";
import { usePersonalData } from "../../personal/context/usePersonalData";
import { fetchMaps } from "../api/mapsApi";
import { MapCard } from "../components/MapCard";

const OTHER = "Other";

interface ModeGroup {
  mode: MapMode | null;
  maps: GameMap[];
}

function groupByMode(maps: GameMap[]): [string, ModeGroup][] {
  const groups = new Map<string, ModeGroup>();
  maps.forEach((map) => {
    const label = map.mode ? MAP_MODE_LABELS[map.mode] : OTHER;
    const group = groups.get(label) ?? { mode: map.mode, maps: [] };
    groups.set(label, { ...group, maps: [...group.maps, map] });
  });
  return [...groups.entries()].sort(([first], [second]) => {
    if (first === OTHER) {
      return 1;
    }
    return second === OTHER ? -1 : first.localeCompare(second);
  });
}

function MapGrid({ maps }: { maps: GameMap[] }) {
  return (
    <ul className="map-grid">
      {maps.map((map) => (
        <li key={map.slug}>
          <MapCard map={map} withFavorite />
        </li>
      ))}
    </ul>
  );
}

export function MapsPage() {
  usePageTitle("Maps");
  const maps = useFetch(fetchMaps, []);
  const { favoriteMaps } = usePersonalData();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<MapMode | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const available = maps.data ?? [];
  const modes = [
    ...new Set(available.flatMap((map) => (map.mode ? [map.mode] : []))),
  ].sort((first, second) =>
    MAP_MODE_LABELS[first].localeCompare(MAP_MODE_LABELS[second]),
  );
  const matching = available.filter(
    (map) =>
      (mode === null || map.mode === mode) &&
      (!onlyFavorites || favoriteMaps.has(map.slug)) &&
      matchesName(map.name, search),
  );

  return (
    <>
      <PageHeader
        title="Maps"
        subtitle="Pick a map to see which heroes over- or under-perform on it"
      />
      {maps.loading && <Spinner />}
      {maps.error && (
        <ErrorMessage failure={maps.error} onRetry={maps.reload} />
      )}
      {maps.data && (
        <>
          <div className="filters">
            <label className="field">
              <span className="field__label">Map</span>
              <input
                type="search"
                value={search}
                placeholder="Search by name"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <div className="field">
              <span className="field__label">Mode</span>
              <div className="segmented" role="group" aria-label="Mode">
                <button
                  type="button"
                  className={clsx("segmented__item", {
                    "segmented__item--active": mode === null,
                  })}
                  aria-pressed={mode === null}
                  onClick={() => setMode(null)}
                >
                  All modes
                </button>
                {modes.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={clsx("segmented__item", {
                      "segmented__item--active": mode === value,
                    })}
                    aria-pressed={mode === value}
                    onClick={() => setMode(value)}
                  >
                    <ModeIcon mode={value} />
                    {MAP_MODE_LABELS[value]}
                  </button>
                ))}
              </div>
            </div>
            <FavoritesFilterButton
              active={onlyFavorites}
              onToggle={() => setOnlyFavorites(!onlyFavorites)}
            />
          </div>
          {matching.length === 0 && (
            <p className="muted">No maps match these filters.</p>
          )}
          {groupByMode(matching).map(([label, group]) => (
            <section key={label} className="section">
              <h2 className="mode-heading">
                {group.mode && <ModeIcon mode={group.mode} />}
                {label}
              </h2>
              <MapGrid maps={group.maps} />
            </section>
          ))}
        </>
      )}
    </>
  );
}
