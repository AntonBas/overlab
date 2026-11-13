export interface PatchPayload {
  version: string;
  slug: string | null;
  title: string | null;
  releasedAt: string;
  notes: string | null;
}
