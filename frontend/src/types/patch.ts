export interface Patch {
  id: number;
  version: string;
  slug: string;
  title: string | null;
  season: number | null;
  releasedAt: string;
  notes: string | null;
}
