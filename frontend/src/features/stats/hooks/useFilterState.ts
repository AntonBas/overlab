import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { StatsSort } from "../../../types/api";
import { parseFilters, toSearchParams, type StatsFilters } from "../filters";

export function useFilterState(fixedMap?: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => {
    const parsed = parseFilters(searchParams);
    return fixedMap
      ? { ...parsed, map: fixedMap, tier: "ALL" as const }
      : parsed;
  }, [searchParams, fixedMap]);

  const update = useCallback(
    (patch: Partial<StatsFilters>) => {
      const next = { ...filters, ...patch };
      if (next.queue === "QUICK_PLAY") {
        next.tier = "ALL";
      }
      const params = toSearchParams(next);
      if (fixedMap) {
        params.delete("map");
        params.delete("tier");
      }
      setSearchParams(params);
    },
    [filters, fixedMap, setSearchParams],
  );

  const changeSort = useCallback(
    (sort: StatsSort) => {
      if (filters.sort === sort) {
        update({ direction: filters.direction === "ASC" ? "DESC" : "ASC" });
      } else {
        update({ sort, direction: sort === "NAME" ? "ASC" : "DESC" });
      }
    },
    [filters.sort, filters.direction, update],
  );

  return { filters, update, changeSort, key: searchParams.toString() };
}
