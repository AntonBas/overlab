import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { StatsSort } from "../../../types/common";
import { usePersonalData } from "../../personal";
import { useCoverage } from "../context/useCoverage";
import { useRegion } from "../context/useRegion";
import {
  applyCoverage,
  parseFilters,
  toSearchParams,
  type StatsFilters,
} from "../filters";

const FILTER_PARAMS = ["queue", "tier", "platform", "region"];
const NO_PRESERVED_PARAMS: readonly string[] = [];

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
  preservedParams: readonly string[] = NO_PRESERVED_PARAMS,
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { preferences, preferencesPending } = usePersonalData();
  const coverage = useCoverage();
  const { region: defaultRegion, rememberRegion } = useRegion();
  const preferencesApplied = useRef(false);
  const explicitFilters = FILTER_PARAMS.some((name) => searchParams.has(name));
  const filters = useMemo(() => {
    const parsed = parseFilters(searchParams, defaultRegion);
    const covered = applyCoverage(
      fixedMap ? { ...parsed, map: fixedMap } : parsed,
      coverage,
    );
    return fixedMap ? { ...covered, map: fixedMap } : covered;
  }, [searchParams, fixedMap, coverage, defaultRegion]);
  const preferred = useMemo(() => {
    if (!preferences) {
      return null;
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
    return next;
  }, [preferences, searchParams, coverage, defaultRegion]);
  const inSync =
    explicitFilters ||
    (preferred === null && !preferencesPending) ||
    (preferred !== null &&
      toSearchParams(preferred, defaultRegion).toString() ===
        searchParams.toString());
  const [wasReady, setWasReady] = useState(false);
  if (inSync && !wasReady) {
    setWasReady(true);
  }
  const ready = wasReady || inSync;

  useEffect(() => {
    if (preferencesApplied.current || !preferred) {
      return;
    }
    preferencesApplied.current = true;
    if (explicitFilters) {
      return;
    }
    const params = toSearchParams(preferred, defaultRegion);
    if (fixedMap) {
      params.delete("map");
    }
    keepPreserved(params, searchParams, preservedParams);
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [
    preferred,
    explicitFilters,
    searchParams,
    fixedMap,
    preservedParams,
    defaultRegion,
    setSearchParams,
  ]);

  const update = useCallback(
    (patch: Partial<StatsFilters>, options: { replace?: boolean } = {}) => {
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
      setSearchParams(params, { replace: options.replace });
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
        update(
          { direction: filters.direction === "ASC" ? "DESC" : "ASC" },
          { replace: true },
        );
      } else {
        update(
          { sort, direction: sort === "NAME" ? "ASC" : "DESC" },
          { replace: true },
        );
      }
    },
    [filters.sort, filters.direction, update],
  );

  return {
    filters,
    update,
    changeSort,
    ready,
    key: JSON.stringify(filters),
  };
}
