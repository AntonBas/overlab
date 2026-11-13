export type RelationType = "COUNTER" | "SYNERGY";

export interface HeroRelation {
  id: number;
  heroSlug: string;
  relatedHeroSlug: string;
  type: RelationType;
  note: string | null;
}

export interface RelationPayload {
  heroSlug: string;
  relatedHeroSlug: string;
  type: RelationType;
  note: string | null;
}

export type CategoryMatchupType =
  "STRONG_AGAINST" | "WEAK_AGAINST" | "WORKS_WITH";

export interface AdminCategory {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  heroSlugs: string[];
}

export interface CategoryPayload {
  slug: string;
  name: string;
  description: string | null;
  heroSlugs: string[];
}

export interface AdminCategoryMatchup {
  id: number;
  heroSlug: string;
  categorySlug: string;
  type: CategoryMatchupType;
  note: string | null;
}

export interface CategoryMatchupPayload {
  heroSlug: string;
  categorySlug: string;
  type: CategoryMatchupType;
  note: string | null;
}

export interface RelationVoteSummary {
  relationId: number;
  heroSlug: string;
  relatedHeroSlug: string;
  type: RelationType;
  up: number;
  down: number;
}
