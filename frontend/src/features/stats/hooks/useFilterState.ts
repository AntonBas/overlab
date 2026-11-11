import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import type { StatsSort } from "../../../types/api";
import { usePersonalData } from "../../personal/context/usePersonalData";
import { useCoverage } from "../context/useCoverage";
import { useRegion } from "../context/useRegion";
import {
  applyCoverage,
  parseFilters,
  toSearchParams,
  type StatsFilters,
} from "../filters";

const FILTER_PARAMS = ["queue", "tier", "platform", "region"];

function keepPreserved(
  target: URLSearchParams,
  source: URLSearchParams,
  names: readonly string[],
) {
  for (const name of names) {
    const value = source.get(name);
    if (value !== null) {
      target.set(name, value);
    }
  }
}

export function useFilterState(
  fixedMap?: string,
  preservedParams: readonly string[] = [],
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { preferences } = usePersonalData();
  const coverage = useCoverage();
  const { region: defaultRegion, rememberRegion } = useRegion();
  const preferencesApplied = useRef(false);
  const filters = useMemo(() => {
    const parsed = parseFilters(searchParams, defaultRegion);
    const covered = applyCoverage(
      fixedMap ? { ...parsed, map: fixedMap } : parsed,
      coverage,
    );
    return fixedMap ? { ...covered, map: fixedMap } : covered;
  }, [searchParams, fixedMap, coverage, defaultRegion]);

  useEffect(() => {
    if (preferencesApplied.current || !preferences) {
      return;
    }
    preferencesApplied.current = true;
    if (FILTER_PARAMS.some((name) => searchParams.has(name))) {
      return;
    }
    const withPreferences = parseFilters(searchParams, defaultRegion);
    const next: StatsFilters = applyCoverage(
      {
        ...withPreferences,
        queue: preferences.queue ?? withPreferences.queue,
        tier: preferences.tier ?? withPreferences.tier,
        platform: preferences.platform ?? withPreferences.platform,
        region: preferences.region ?? withPreferences.region,
      },
      coverage,
    );
    if (next.queue === "QUICK_PLAY") {
      next.tier = "ALL";
    }
    const params = toSearchParams(next, defaultRegion);
    if (fixedMap) {
      params.delete("map");
    }
    keepPreserved(params, searchParams, preservedParams);
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [
    preferences,
    searchParams,
    fixedMap,
    preservedParams,
    coverage,
    defaultRegion,
    setSearchParams,
  ]);

  const update = useCallback(
    (patch: Partial<StatsFilters>) => {
      const next = applyCoverage({ ...filters, ...patch }, coverage);
      if (next.queue === "QUICK_PLAY") {
        next.tier = "ALL";
      }
      if (patch.region) {
        rememberRegion(patch.region);
      }
      const params = toSearchParams(next, patch.region ?? defaultRegion);
      if (fixedMap) {
        params.delete("map");
      }
      keepPreserved(params, searchParams, preservedParams);
      setSearchParams(params);
    },
    [
      filters,
      fixedMap,
      preservedParams,
      searchParams,
      coverage,
      defaultRegion,
      rememberRegion,
      setSearchParams,
    ],
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
