import type {
  CategoryMatchup,
  HeroCategory,
  RelatedHero,
} from "../../../types/hero";

export function withoutCoveredHeroes(
  related: RelatedHero[],
  matchups: CategoryMatchup[],
  categoriesBySlug: Map<string, HeroCategory>,
): RelatedHero[] {
  const covered = new Set<string>();
  for (const matchup of matchups) {
    const category = categoriesBySlug.get(matchup.categorySlug);
    for (const member of category?.heroes ?? []) {
      covered.add(member.slug);
    }
  }
  return related.filter((hero) => !covered.has(hero.slug));
}
