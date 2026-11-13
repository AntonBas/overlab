import type { CSSProperties } from "react";

const HEROES_WITH_BACKDROP: ReadonlySet<string> = new Set([
  "ana",
  "anran",
  "ashe",
  "baptiste",
  "bastion",
  "brigitte",
  "cassidy",
  "dmon",
  "doctrine",
  "domina",
  "doomfist",
  "dva",
  "echo",
  "emre",
  "freja",
  "genji",
  "hanzo",
  "hazard",
  "illari",
  "jetpack-cat",
  "junker-queen",
  "junkrat",
  "juno",
  "kiriko",
  "lifeweaver",
  "lucio",
  "mauga",
  "mei",
  "mercy",
  "mizuki",
  "moira",
  "orisa",
  "pharah",
  "ramattra",
  "reaper",
  "reinhardt",
  "roadhog",
  "shion",
  "sierra",
  "sigma",
  "sojourn",
  "soldier-76",
  "sombra",
  "symmetra",
  "torbjorn",
  "tracer",
  "vendetta",
  "venture",
  "widowmaker",
  "winston",
  "wrecking-ball",
  "wuyang",
  "zarya",
  "zenyatta",
]);

export function heroBackdropUrl(slug: string): string | undefined {
  return HEROES_WITH_BACKDROP.has(slug)
    ? `/images/backgrounds/${slug}.webp`
    : undefined;
}

export function heroBackdropStyle(slug: string): CSSProperties | undefined {
  const url = heroBackdropUrl(slug);
  if (!url) {
    return undefined;
  }
  return {
    backgroundImage: `linear-gradient(180deg, rgb(15 18 24 / 0.55), rgb(15 18 24 / 0.88)), url(${url})`,
  };
}
