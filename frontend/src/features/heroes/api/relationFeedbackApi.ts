import { api } from "../../../services/api";

export type RelationKind = "COUNTER" | "SYNERGY";
export type RelationVoteValue = "UP" | "DOWN";

export interface RelationVote {
  heroSlug: string;
  relatedHeroSlug: string;
  type: RelationKind;
  value: RelationVoteValue;
}

export async function fetchRelationVotes(): Promise<RelationVote[]> {
  const { data } = await api.get<RelationVote[]>("/me/relation-votes");
  return data;
}

export async function saveRelationVote(vote: RelationVote): Promise<void> {
  await api.put("/me/relation-votes", vote);
}

export async function removeRelationVote(
  heroSlug: string,
  relatedHeroSlug: string,
  type: RelationKind,
): Promise<void> {
  await api.delete("/me/relation-votes", {
    params: { heroSlug, relatedHeroSlug, type },
  });
}

export async function sendRelationReport(report: {
  heroSlug: string;
  relatedHeroSlug: string;
  type: RelationKind;
  message: string;
}): Promise<void> {
  await api.post("/me/relation-reports", report);
}
