import type { Hero } from "../../../types/hero";

export interface AdminHero extends Hero {
  active: boolean;
}
