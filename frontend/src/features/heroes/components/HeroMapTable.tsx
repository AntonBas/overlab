import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DeltaValue } from "../../../components/ui/DeltaValue";
import { ModeIcon } from "../../../components/ui/ModeIcon";
import { RateBar } from "../../../components/ui/RateBar";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import { useFetch } from "../../../hooks/useFetch";
import { mapPagePath } from "../utils/mapPagePath";
import type { HeroMapStat } from "../../../types/api";
import { MAP_MODE_LABELS } from "../../../utils/format";
import { MAP_PLACEHOLDER_URL } from "../../../utils/modes";
import { fetchMaps } from "../../maps/api/mapsApi";

type MapSort = "WIN_RATE" | "PICK_RATE" | "NAME";

const SORT_LABELS: Record<MapSort, string> = {
  WIN_RATE: "Win rate",
  PICK_RATE: "Pick rate",
  NAME: "Map name",
};

function compare(sort: MapSort, first: HeroMapStat, second: HeroMapStat) {
  switch (sort) {
    case "WIN_RATE":
      return second.winRate - first.winRate;
    case "PICK_RATE":
      return second.pickRate - first.pickRate;
    case "NAME":
      return (first.mapName ?? "").localeCompare(second.mapName ?? "");
  }
}

export function HeroMapTable({
  maps,
  linkSuffix,
}: {
  maps: HeroMapStat[];
  linkSuffix: string;
}) {
  const [sort, setSort] = useState<MapSort>("WIN_RATE");
  const allMaps = useFetch(fetchMaps, []);
  const images = Object.fromEntries(
    (allMaps.data ?? []).map((map) => [map.slug, map.imageUrl]),
  );
  const sorted = useMemo(
    () => [...maps].sort((first, second) => compare(sort, first, second)),
    [maps, sort],
  );

  return (
    <>
      <label className="field field--inline">
        <span className="field__label">Sort maps by</span>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as MapSort)}
        >
          {(Object.keys(SORT_LABELS) as MapSort[]).map((option) => (
            <option key={option} value={option}>
              {SORT_LABELS[option]}
            </option>
          ))}
        </select>
      </label>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Map</th>
              <th scope="col">Win rate</th>
              <th scope="col">Pick rate</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((map) => (
              <tr key={map.mapSlug}>
                <th scope="row">
                  <span className="table__hero">
                    <Thumbnail
                      url={images[map.mapSlug ?? ""] ?? MAP_PLACEHOLDER_URL}
                      width={64}
                      height={36}
                    />
                    <Link to={mapPagePath(map.mapSlug ?? "", linkSuffix)}>
                      {map.mapName}
                    </Link>
                    {map.mode && (
                      <span className="muted table__mode">
                        <ModeIcon mode={map.mode} />
                        {MAP_MODE_LABELS[map.mode]}
                      </span>
                    )}
                  </span>
                </th>
                <td>
                  <RateBar value={map.winRate} tone="win" />
                  <DeltaValue value={map.winRateDelta} />
                </td>
                <td>
                  <RateBar value={map.pickRate} tone="pick" max={40} />
                  <DeltaValue value={map.pickRateDelta} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
