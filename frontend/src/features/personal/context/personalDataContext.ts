import { createContext } from "react";
import type { Preferences } from "../../../types/user";

export interface PersonalDataValue {
  favoriteHeroes: ReadonlySet<string>;
  favoriteMaps: ReadonlySet<string>;
  preferences: Preferences | null;
  preferencesLoaded: boolean;
  preferencesFailed: boolean;
  preferencesPending: boolean;
  reloadPreferences: () => void;
  failure: string | null;
  toggleHeroFavorite: (slug: string) => Promise<void>;
  toggleMapFavorite: (slug: string) => Promise<void>;
  replacePreferences: (preferences: Preferences) => void;
}

export const EMPTY_PERSONAL_DATA: PersonalDataValue = {
  favoriteHeroes: new Set(),
  favoriteMaps: new Set(),
  preferences: null,
  preferencesLoaded: false,
  preferencesFailed: false,
  preferencesPending: false,
  reloadPreferences: () => undefined,
  failure: null,
  toggleHeroFavorite: () => Promise.resolve(),
  toggleMapFavorite: () => Promise.resolve(),
  replacePreferences: () => undefined,
};

export const PersonalDataContext =
  createContext<PersonalDataValue>(EMPTY_PERSONAL_DATA);
