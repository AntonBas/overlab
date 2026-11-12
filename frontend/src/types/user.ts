import type { GameQueue, Platform, RankTier, Region } from "./common";
import type { Hero } from "./hero";
import type { GameMap } from "./map";

export type UserRole = "USER" | "ADMIN";

export interface User {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
  provider: "LOCAL" | "GOOGLE";
  emailVerified: boolean;
}

export interface Favorites {
  heroes: Hero[];
  maps: GameMap[];
}

export interface Preferences {
  queue: GameQueue | null;
  platform: Platform | null;
  region: Region | null;
  tier: RankTier | null;
}
