import { Link } from "react-router-dom";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import type { GameMap } from "../../../types/api";
import { MAP_MODE_LABELS } from "../../../utils/format";
import { fetchMaps } from "../api/mapsApi";

function groupByMode(maps: GameMap[]): [string, GameMap[]][] {
  const groups = new Map<string, GameMap[]>();
  maps.forEach((map) => {
    const label = map.mode ? MAP_MODE_LABELS[map.mode] : "Other";
    groups.set(label, [...(groups.get(label) ?? []), map]);
  });
  return [...groups.entries()].sort(([first], [second]) => {
    if (first === "Other") {
      return 1;
    }
    return second === "Other" ? -1 : first.localeCompare(second);
  });
}

export function MapsPage() {
  usePageTitle("Maps");
  const maps = useFetch(fetchMaps, []);

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
      {maps.data &&
        groupByMode(maps.data).map(([label, group]) => (
          <section key={label} className="section">
            <h2>{label}</h2>
            <ul className="chip-list">
              {group.map((map) => (
                <li key={map.slug}>
                  <Link className="chip" to={`/maps/${map.slug}`}>
                    {map.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </>
  );
}
