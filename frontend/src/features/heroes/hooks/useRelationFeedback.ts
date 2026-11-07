import { useCallback, useEffect, useMemo, useState } from "react";
import { toFailure } from "../../../services/api";
import { useAuth } from "../../auth/context/useAuth";
import {
  fetchRelationVotes,
  removeRelationVote,
  saveRelationVote,
  type RelationKind,
  type RelationVoteValue,
} from "../api/relationFeedbackApi";

export interface RelationFeedback {
  heroSlug: string;
  signedIn: boolean;
  failure: string | null;
  voteOf: (
    relatedHeroSlug: string,
    type: RelationKind,
  ) => RelationVoteValue | null;
  vote: (
    relatedHeroSlug: string,
    type: RelationKind,
    value: RelationVoteValue,
  ) => Promise<void>;
}

interface StoredVotes {
  userId: number | null;
  votes: ReadonlyMap<string, RelationVoteValue>;
}

const NO_VOTES: StoredVotes = { userId: null, votes: new Map() };

function pairKey(first: string, second: string, type: RelationKind): string {
  return `${type}:${[first, second].sort().join("|")}`;
}

export function useRelationFeedback(heroSlug: string): RelationFeedback {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [stored, setStored] = useState<StoredVotes>(NO_VOTES);
  const [failure, setFailure] = useState<string | null>(null);
  const votes = stored.userId === userId ? stored.votes : NO_VOTES.votes;

  useEffect(() => {
    if (userId === null) {
      return;
    }
    let cancelled = false;
    fetchRelationVotes()
      .then((loaded) => {
        if (!cancelled) {
          setStored({
            userId,
            votes: new Map(
              loaded.map((vote) => [
                pairKey(vote.heroSlug, vote.relatedHeroSlug, vote.type),
                vote.value,
              ]),
            ),
          });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const voteOf = useCallback(
    (relatedHeroSlug: string, type: RelationKind) =>
      votes.get(pairKey(heroSlug, relatedHeroSlug, type)) ?? null,
    [heroSlug, votes],
  );

  const vote = useCallback(
    async (
      relatedHeroSlug: string,
      type: RelationKind,
      value: RelationVoteValue,
    ) => {
      const key = pairKey(heroSlug, relatedHeroSlug, type);
      const previous = votes.get(key) ?? null;
      const next = previous === value ? null : value;
      const apply = (applied: RelationVoteValue | null) =>
        setStored((existing) => {
          const updated = new Map(
            existing.userId === userId ? existing.votes : [],
          );
          if (applied === null) {
            updated.delete(key);
          } else {
            updated.set(key, applied);
          }
          return { userId, votes: updated };
        });
      apply(next);
      setFailure(null);
      try {
        if (next === null) {
          await removeRelationVote(heroSlug, relatedHeroSlug, type);
        } else {
          await saveRelationVote({
            heroSlug,
            relatedHeroSlug,
            type,
            value: next,
          });
        }
      } catch (error) {
        apply(previous);
        setFailure(toFailure(error).message);
      }
    },
    [heroSlug, userId, votes],
  );

  return useMemo(
    () => ({
      heroSlug,
      signedIn: userId !== null,
      failure,
      voteOf,
      vote,
    }),
    [heroSlug, userId, failure, voteOf, vote],
  );
}
