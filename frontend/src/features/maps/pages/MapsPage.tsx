import clsx from "clsx";
import { useState } from "react";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import type { GameMap, MapMode } from "../../../types/api";
import { MAP_MODE_LABELS } from "../../../utils/format";
import { matchesName } from "../../../utils/search";
import { usePersonalData } from "../../personal/context/usePersonalData";
import { fetchMaps } from "../api/mapsApi";
import { MapCard } from "../components/MapCard";

const OTHER = "Other";

function groupByMode(maps: GameMap[]): [string, GameMap[]][] {
  const groups = new Map<string, GameMap[]>();
  maps.forEach((map) => {
    const label = map.mode ? MAP_MODE_LABELS[map.mode] : OTHER;
    groups.set(label, [...(groups.get(label) ?? []), map]);
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
          <MapCard map={map} />
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

  const available = maps.data ?? [];
  const modes = [
    ...new Set(available.flatMap((map) => (map.mode ? [map.mode] : []))),
  ].sort((first, second) =>
    MAP_MODE_LABELS[first].localeCompare(MAP_MODE_LABELS[second]),
  );
  const matching = available.filter(
    (map) =>
      (mode === null || map.mode === mode) && matchesName(map.name, search),
  );
  const favorites = matching.filter((map) => favoriteMaps.has(map.slug));

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
                  {MAP_MODE_LABELS[value]}
                </button>
              ))}
            </div>
          </div>
          {matching.length === 0 && (
            <p className="muted">No maps match these filters.</p>
          )}
          {favorites.length > 0 && (
            <section className="section">
              <h2>Favorites</h2>
              <MapGrid maps={favorites} />
            </section>
          )}
          {groupByMode(matching).map(([label, group]) => (
            <section key={label} className="section">
              <h2>{label}</h2>
              <MapGrid maps={group} />
            </section>
          ))}
        </>
      )}
    </>
  );
}
