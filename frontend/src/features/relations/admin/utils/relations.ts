import type { HeroRelation, RelationType } from "../types";

export function describeRelationConflict(
  candidate: { heroSlug: string; relatedHeroSlug: string; type: RelationType },
  existing: HeroRelation[],
  editingId: number | null,
): string | null {
  if (candidate.heroSlug && candidate.heroSlug === candidate.relatedHeroSlug) {
    return "A hero cannot be related to itself.";
  }
  const others = existing.filter(
    (relation) => relation.id !== editingId && relation.type === candidate.type,
  );
  if (
    others.some(
      (relation) =>
        relation.heroSlug === candidate.heroSlug &&
        relation.relatedHeroSlug === candidate.relatedHeroSlug,
    )
  ) {
    return "This relation already exists.";
  }
  if (
    others.some(
      (relation) =>
        relation.heroSlug === candidate.relatedHeroSlug &&
        relation.relatedHeroSlug === candidate.heroSlug,
    )
  ) {
    return "The reverse relation already exists, so this pair is already covered.";
  }
  return null;
}
