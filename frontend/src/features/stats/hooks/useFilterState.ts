import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import type { StatsSort } from "../../../types/api";
import { usePersonalData } from "../../personal/context/usePersonalData";
import { parseFilters, toSearchParams, type StatsFilters } from "../filters";

const FILTER_PARAMS = ["queue", "tier", "platform", "region"];

export function useFilterState(fixedMap?: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { preferences } = usePersonalData();
  const preferencesApplied = useRef(false);
  const filters = useMemo(() => {
    const parsed = parseFilters(searchParams);
    return fixedMap
      ? { ...parsed, map: fixedMap, tier: "ALL" as const }
      : parsed;
  }, [searchParams, fixedMap]);

  useEffect(() => {
    if (preferencesApplied.current || !preferences) {
      return;
    }
    preferencesApplied.current = true;
    if (FILTER_PARAMS.some((name) => searchParams.has(name))) {
      return;
    }
    const withPreferences = parseFilters(searchParams);
    const next: StatsFilters = {
      ...withPreferences,
      queue: preferences.queue ?? withPreferences.queue,
      tier: preferences.tier ?? withPreferences.tier,
      platform: preferences.platform ?? withPreferences.platform,
      region: preferences.region ?? withPreferences.region,
    };
    if (next.queue === "QUICK_PLAY") {
      next.tier = "ALL";
    }
    const params = toSearchParams(next);
    if (fixedMap) {
      params.delete("map");
      params.delete("tier");
    }
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [preferences, searchParams, fixedMap, setSearchParams]);

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
