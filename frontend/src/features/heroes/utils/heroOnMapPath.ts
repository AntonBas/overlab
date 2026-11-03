export function heroOnMapPath(
  heroSlug: string,
  mapSlug: string,
  queueSuffix = "",
): string {
  const params = new URLSearchParams({ map: mapSlug });
  if (queueSuffix.includes("quick_play")) {
    params.set("queue", "quick_play");
  }
  return `/heroes/${heroSlug}?${params.toString()}`;
}
