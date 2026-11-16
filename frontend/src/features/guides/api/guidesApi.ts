import { api } from "../../../services/api";
import type { Guide } from "../../../types/guide";

export interface GuideQuery {
  hero?: string;
  map?: string;
}

export async function fetchGuides(query: GuideQuery = {}): Promise<Guide[]> {
  const { data } = await api.get<Guide[]>("/guides", { params: query });
  return data;
}

export async function fetchGuide(path: string): Promise<Guide> {
  const { data } = await api.get<Guide>(`/guides/${encodeURIComponent(path)}`);
  return data;
}
