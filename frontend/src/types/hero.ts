export type HeroRole = "TANK" | "DAMAGE" | "SUPPORT";

export interface Hero {
  slug: string;
  name: string;
  role: HeroRole;
  subrole: string | null;
  description: string | null;
  strengths: string | null;
  weaknesses: string | null;
  portraitUrl: string | null;
  recentlyAdded?: boolean;
}

export type AbilityControl =
  | "PRIMARY_FIRE"
  | "SECONDARY_FIRE"
  | "ABILITY_1"
  | "ABILITY_2"
  | "ULTIMATE"
  | "JUMP"
  | "CROUCH"
  | "PASSIVE";

export interface Ability {
  heroSlug: string;
  heroName: string;
  heroPortraitUrl: string | null;
  slug: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  control: AbilityControl | null;
  recentlyAdded?: boolean;
}

export type PerkSlot = "MINOR" | "MAJOR";

export type PerkPosition = "LEFT" | "RIGHT";

export type PerkRecommendation = "RECOMMENDED" | "OPTIONAL" | "AVOID";

export interface Perk {
  id: number;
  heroSlug: string;
  name: string;
  description: string | null;
  slot: PerkSlot;
  position: PerkPosition;
  recommendation: PerkRecommendation;
  recommendationNote: string | null;
  iconUrl: string | null;
  recentlyAdded?: boolean;
}

export interface RelatedHero {
  slug: string;
  name: string;
  role: HeroRole;
  note: string | null;
  portraitUrl: string | null;
}

export interface HeroCounters {
  counters: RelatedHero[];
  counteredBy: RelatedHero[];
}

export interface HeroRelations {
  heroSlug: string;
  counters: RelatedHero[];
  counteredBy: RelatedHero[];
  synergies: RelatedHero[];
}

export interface CategoryMember {
  slug: string;
  name: string;
  role: HeroRole;
  portraitUrl: string | null;
}

export interface HeroCategory {
  slug: string;
  name: string;
  description: string | null;
  heroes: CategoryMember[];
}

export type CategoryMatchupType =
  "STRONG_AGAINST" | "WEAK_AGAINST" | "WORKS_WITH";

export interface CategoryMatchup {
  heroSlug: string;
  categorySlug: string;
  type: CategoryMatchupType;
  note: string | null;
}

export interface HeroCategories {
  categories: HeroCategory[];
  matchups: CategoryMatchup[];
}
