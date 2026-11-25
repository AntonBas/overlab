export type RelationTabId = "strong" | "struggles" | "synergies";

export const RELATION_TAB_SLUGS: Record<RelationTabId, string> = {
  strong: "strong-against",
  struggles: "struggles-against",
  synergies: "synergies",
};

export function relationTabIdOf(slug: string | undefined) {
  return (Object.keys(RELATION_TAB_SLUGS) as RelationTabId[]).find(
    (id) => RELATION_TAB_SLUGS[id] === slug,
  );
}

export function countersPath(heroSlug: string) {
  return `/heroes/${heroSlug}/counters`;
}

export function relationPath(
  heroSlug: string,
  tab: RelationTabId,
  relatedSlug?: string,
) {
  const tabPath = `${countersPath(heroSlug)}/${RELATION_TAB_SLUGS[tab]}`;
  return relatedSlug ? `${tabPath}/${relatedSlug}` : tabPath;
}
