import type { Hero } from "../types/hero";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function matchHeroes(heroes: Hero[], query: string, limit = 8): Hero[] {
  const needle = normalize(query);
  if (needle === "") {
    return [];
  }
  const starts: Hero[] = [];
  const contains: Hero[] = [];
  for (const hero of heroes) {
    const name = normalize(hero.name);
    if (name.startsWith(needle)) {
      starts.push(hero);
    } else if (name.includes(needle)) {
      contains.push(hero);
    }
  }
  return [...starts, ...contains].slice(0, limit);
}

export function matchesName(name: string, query: string): boolean {
  return normalize(name).includes(normalize(query));
}
