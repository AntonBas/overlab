import type {
  CategoryMatchup,
  HeroCategory,
  RelatedHero,
} from "../../../types/api";

export function withoutCoveredHeroes(
  related: RelatedHero[],
  matchups: CategoryMatchup[],
  categoriesBySlug: Map<string, HeroCategory>,
): RelatedHero[] {
  const coveredStrength = new Map<string, number>();
  for (const matchup of matchups) {
    const category = categoriesBySlug.get(matchup.categorySlug);
    for (const member of category?.heroes ?? []) {
      coveredStrength.set(
        member.slug,
        Math.max(coveredStrength.get(member.slug) ?? 0, matchup.strength),
      );
    }
  }
  return related.filter(
    (hero) => hero.strength > (coveredStrength.get(hero.slug) ?? 0),
  );
}
