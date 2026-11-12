export type GuideKind = "SETUP" | "POSITION" | "ULTIMATE" | "TIP";

export type GuideSide = "ATTACK" | "DEFENSE" | "BOTH";

export interface Guide {
  id: number;
  slug: string;
  path: string;
  heroSlug: string;
  heroName: string;
  mapSlug: string | null;
  mapName: string | null;
  title: string;
  youtubeId: string;
  startSeconds: number;
  endSeconds: number | null;
  kind: GuideKind;
  side: GuideSide;
  abilitySlug: string | null;
  embedUrl: string;
  description: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: string;
}
