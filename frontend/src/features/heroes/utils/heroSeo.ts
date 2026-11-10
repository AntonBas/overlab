import { plainDescription } from "../../../hooks/usePageDescription";

export function heroPageTitle(name: string): string {
  return `${name} stats, perks, counters and best maps`;
}

export function heroPageDescription(
  name: string,
  description: string | null | undefined,
): string {
  const lead = `${name} Overwatch 2 stats: win, pick and ban rates, perks, counters and best maps.`;
  return plainDescription(description ? `${lead} ${description}` : lead);
}
