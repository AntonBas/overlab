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

export interface RelationVotes {
  signedIn: boolean;
  failure: string | null;
  voteOf: (
    heroSlug: string,
    relatedHeroSlug: string,
    type: RelationKind,
  ) => RelationVoteValue | null;
  vote: (
    heroSlug: string,
    relatedHeroSlug: string,
    type: RelationKind,
    value: RelationVoteValue,
  ) => Promise<void>;
}

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

export function bindRelationFeedback(
  votes: RelationVotes,
  heroSlug: string,
): RelationFeedback {
  return {
    heroSlug,
    signedIn: votes.signedIn,
    failure: votes.failure,
    voteOf: (relatedHeroSlug, type) =>
      votes.voteOf(heroSlug, relatedHeroSlug, type),
    vote: (relatedHeroSlug, type, value) =>
      votes.vote(heroSlug, relatedHeroSlug, type, value),
  };
}

export function useRelationVotes(): RelationVotes {
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
    (heroSlug: string, relatedHeroSlug: string, type: RelationKind) =>
      votes.get(pairKey(heroSlug, relatedHeroSlug, type)) ?? null,
    [votes],
  );

  const vote = useCallback(
    async (
      heroSlug: string,
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
    [userId, votes],
  );

  return useMemo(
    () => ({ signedIn: userId !== null, failure, voteOf, vote }),
    [userId, failure, voteOf, vote],
  );
}

export function useRelationFeedback(heroSlug: string): RelationFeedback {
  const votes = useRelationVotes();
  return useMemo(
    () => bindRelationFeedback(votes, heroSlug),
    [votes, heroSlug],
  );
}
