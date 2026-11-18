import { useCallback } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import type { HeroRole } from "../../../types/hero";

const ROLE_VALUES: readonly HeroRole[] = ["TANK", "DAMAGE", "SUPPORT"];
const FAVORITES_VALUE = "1";

interface RowsState {
  rows?: number;
}

function parseRole(value: string | null): HeroRole | null {
  return ROLE_VALUES.find((role) => role === value) ?? null;
}

function parseRows(state: unknown, step: number): number {
  const rows = (state as RowsState | null)?.rows;
  return typeof rows === "number" && Number.isFinite(rows) && rows >= step
    ? rows
    : step;
}

export interface HeroListView {
  role: HeroRole | null;
  query: string;
  onlyFavorites: boolean;
  shownRows: number;
  setRole: (role: HeroRole | null) => void;
  setQuery: (query: string) => void;
  setOnlyFavorites: (onlyFavorites: boolean) => void;
  showMore: () => void;
}

/**
 * Keeps the hero list filters in the address bar and the number of revealed rows in the history entry,
 * so going back from a hero page restores the same view.
 */
export function useHeroListView(step: number): HeroListView {
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = useLocation();
  const role = parseRole(searchParams.get("role"));
  const query = searchParams.get("q") ?? "";
  const onlyFavorites = searchParams.get("favorites") === FAVORITES_VALUE;
  const shownRows = parseRows(state, step);

  const update = useCallback(
    (changes: Record<string, string | null>, rows: number) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      setSearchParams(next, { replace: true, state: { rows } });
    },
    [searchParams, setSearchParams],
  );

  return {
    role,
    query,
    onlyFavorites,
    shownRows,
    setRole: (next) => update({ role: next }, step),
    setQuery: (next) => update({ q: next }, step),
    setOnlyFavorites: (next) =>
      update({ favorites: next ? FAVORITES_VALUE : null }, step),
    showMore: () => update({}, shownRows + step),
  };
}
