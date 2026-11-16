import clsx from "clsx";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { ModeIcon } from "../../../components/ui/ModeIcon";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { useUrlFlag, useUrlParam } from "../../../hooks/useUrlParam";
import {
  breadcrumbList,
  useStructuredData,
} from "../../../hooks/useStructuredData";
import { usePageDescription } from "../../../hooks/usePageDescription";
import type { GameMap, MapMode } from "../../../types/map";
import { MAP_MODE_LABELS } from "../../../utils/format";
import { matchesName } from "../../../utils/search";
import { FavoritesFilterButton } from "../../personal";
import { usePersonalData } from "../../personal";
import { fetchMaps } from "../api/mapsApi";
import { MapCard } from "../components/MapCard";
import { FiltersPanel } from "../../../components/ui/FiltersPanel";
import { staticSeoPage } from "../../../utils/staticSeoPages";

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

function parseMode(value: string): MapMode | null {
  return Object.hasOwn(MAP_MODE_LABELS, value) ? (value as MapMode) : null;
}

export function MapsPage() {
  const page = staticSeoPage("/maps");
  usePageTitle(page.title);
  usePageDescription(page.description);
  useStructuredData(
    breadcrumbList(
      [
        { name: "Overlab", path: "/" },
        { name: "Maps", path: "/maps" },
      ],
      window.location.origin,
    ),
  );
  const maps = useFetch(fetchMaps, []);
  const { favoriteMaps } = usePersonalData();
  const [search, setSearch] = useUrlParam("q");
  const [modeParam, setModeParam] = useUrlParam("mode");
  const [onlyFavorites, setOnlyFavorites] = useUrlFlag("favorites");
  const mode = parseMode(modeParam);

  function setMode(next: MapMode | null) {
    setModeParam(next ?? "");
  }

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
      {maps.loading && <Spinner page />}
      {maps.error && (
        <ErrorMessage failure={maps.error} onRetry={maps.reload} />
      )}
      {maps.data && (
        <>
          <FiltersPanel>
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
          </FiltersPanel>
          {matching.length === 0 && (
            <p className="muted">No maps match these filters.</p>
          )}
          {groupByMode(matching).map(([label, group]) => (
            <section key={label} className="section map-section">
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
