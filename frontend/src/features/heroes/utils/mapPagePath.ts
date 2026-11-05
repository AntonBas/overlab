export function mapPagePath(mapSlug: string, queueSuffix = ""): string {
  return queueSuffix.includes("quick_play")
    ? `/maps/${mapSlug}?queue=quick_play`
    : `/maps/${mapSlug}`;
}
