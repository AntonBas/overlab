import type { Guide } from "../../types/guide";

export function guide(overrides: Partial<Guide> = {}): Guide {
  return {
    id: 1,
    slug: "ana-sleep-dart",
    path: "/guides/ana-sleep-dart",
    heroSlug: "ana",
    heroName: "Ana",
    mapSlug: null,
    mapName: null,
    title: "Sleep dart timing",
    youtubeId: "dQw4w9WgXcQ",
    startSeconds: 0,
    endSeconds: null,
    kind: "TIP",
    side: "BOTH",
    abilitySlug: null,
    embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    description: null,
    sortOrder: 0,
    published: true,
    createdAt: "2026-10-01T00:00:00Z",
    ...overrides,
  };
}
