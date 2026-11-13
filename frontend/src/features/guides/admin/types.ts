import type { GuideKind, GuideSide } from "../../../types/guide";

export interface GuidePayload {
  heroSlug: string;
  mapSlug: string | null;
  title: string;
  slug: string | null;
  youtubeId: string;
  startSeconds: number;
  endSeconds: number | null;
  kind: GuideKind;
  side: GuideSide;
  abilitySlug: string | null;
  description: string | null;
  sortOrder: number;
  published: boolean;
}
