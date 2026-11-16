import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toFailure } from "../../../services/api";
import type { Preferences } from "../../../types/user";
import { useAuth } from "../../auth";
import * as personalApi from "../api/personalApi";
import { PersonalDataContext } from "./personalDataContext";

type FavoriteKind = "hero" | "map";

interface PersonalState {
  userId: number | null;
  heroes: ReadonlySet<string>;
  maps: ReadonlySet<string>;
  preferences: Preferences | null;
  preferencesLoaded: boolean;
  preferencesFailed: boolean;
}

const EMPTY_STATE: PersonalState = {
  userId: null,
  heroes: new Set(),
  maps: new Set(),
  preferences: null,
  preferencesLoaded: false,
  preferencesFailed: false,
};

export function PersonalDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [stored, setStored] = useState<PersonalState>(EMPTY_STATE);
  const [failure, setFailure] = useState<string | null>(null);
  const [preferencesAttempt, setPreferencesAttempt] = useState(0);
  const state = stored.userId === userId ? stored : EMPTY_STATE;
  const current = useRef(state);
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    current.current = state;
  }, [state]);

  useEffect(() => {
    if (userId === null) {
      return;
    }
    let cancelled = false;
    personalApi
      .fetchFavorites()
      .then((favorites) => {
        if (!cancelled) {
          setStored((existing) => ({
            ...(existing.userId === userId ? existing : EMPTY_STATE),
            userId,
            heroes: new Set(favorites.heroes.map((hero) => hero.slug)),
            maps: new Set(favorites.maps.map((map) => map.slug)),
          }));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (userId === null) {
      return;
    }
    let cancelled = false;
    personalApi
      .fetchPreferences()
      .then(
        (preferences) => ({ preferences, failed: false }),
        () => ({ preferences: null, failed: true }),
      )
      .then(({ preferences, failed }) => {
        if (!cancelled) {
          setStored((existing) => ({
            ...(existing.userId === userId ? existing : EMPTY_STATE),
            userId,
            preferences,
            preferencesLoaded: !failed,
            preferencesFailed: failed,
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId, preferencesAttempt]);

  const reloadPreferences = useCallback(
    () => setPreferencesAttempt((attempt) => attempt + 1),
    [],
  );

  const toggle = useCallback(async (kind: FavoriteKind, slug: string) => {
    const flightKey = `${kind}:${slug}`;
    if (inFlight.current.has(flightKey)) {
      return;
    }
    inFlight.current.add(flightKey);
    const wasFavorite =
      kind === "hero"
        ? current.current.heroes.has(slug)
        : current.current.maps.has(slug);
    const field = kind === "hero" ? "heroes" : "maps";
    const apply = (favorite: boolean) => {
      const next = new Set(current.current[field]);
      if (favorite) {
        next.add(slug);
      } else {
        next.delete(slug);
      }
      current.current = { ...current.current, [field]: next };
      setStored((existing) => {
        const updated = new Set(existing[field]);
        if (favorite) {
          updated.add(slug);
        } else {
          updated.delete(slug);
        }
        return { ...existing, [field]: updated };
      });
    };
    apply(!wasFavorite);
    setFailure(null);
    try {
      if (kind === "hero") {
        await (wasFavorite
          ? personalApi.removeFavoriteHero(slug)
          : personalApi.addFavoriteHero(slug));
      } else {
        await (wasFavorite
          ? personalApi.removeFavoriteMap(slug)
          : personalApi.addFavoriteMap(slug));
      }
    } catch (error) {
      apply(wasFavorite);
      setFailure(toFailure(error).message);
    } finally {
      inFlight.current.delete(flightKey);
    }
  }, []);

  const toggleHeroFavorite = useCallback(
    (slug: string) => toggle("hero", slug),
    [toggle],
  );
  const toggleMapFavorite = useCallback(
    (slug: string) => toggle("map", slug),
    [toggle],
  );
  const replacePreferences = useCallback(
    (preferences: Preferences) =>
      setStored((existing) => ({ ...existing, preferences })),
    [],
  );

  const value = useMemo(
    () => ({
      favoriteHeroes: state.heroes,
      favoriteMaps: state.maps,
      preferences: state.preferences,
      preferencesLoaded: state.preferencesLoaded,
      preferencesFailed: state.preferencesFailed,
      reloadPreferences,
      failure,
      toggleHeroFavorite,
      toggleMapFavorite,
      replacePreferences,
    }),
    [
      state,
      failure,
      reloadPreferences,
      toggleHeroFavorite,
      toggleMapFavorite,
      replacePreferences,
    ],
  );

  return (
    <PersonalDataContext.Provider value={value}>
      {children}
    </PersonalDataContext.Provider>
  );
}
