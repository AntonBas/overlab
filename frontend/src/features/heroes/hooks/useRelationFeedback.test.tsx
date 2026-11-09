import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../../../types/api";

vi.mock("../api/relationFeedbackApi", () => ({
  fetchRelationVotes: vi.fn(),
  saveRelationVote: vi.fn(),
  removeRelationVote: vi.fn(),
}));

let currentUser: User | null = null;
vi.mock("../../auth/context/useAuth", () => ({
  useAuth: () => ({
    user: currentUser,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    replaceUser: vi.fn(),
  }),
}));

import {
  fetchRelationVotes,
  removeRelationVote,
  saveRelationVote,
} from "../api/relationFeedbackApi";
import { useRelationFeedback } from "./useRelationFeedback";

const signedIn: User = {
  id: 7,
  email: "ana@overlab.gg",
  displayName: "Ana",
  role: "USER",
  provider: "LOCAL",
  emailVerified: true,
};

describe("useRelationFeedback", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    currentUser = signedIn;
    vi.mocked(fetchRelationVotes).mockResolvedValue([
      {
        heroSlug: "zarya",
        relatedHeroSlug: "ana",
        type: "COUNTER",
        value: "DOWN",
      },
    ]);
    vi.mocked(saveRelationVote).mockResolvedValue();
    vi.mocked(removeRelationVote).mockResolvedValue();
  });

  it("matches stored votes in either direction", async () => {
    const { result } = renderHook(() => useRelationFeedback("ana"));

    await waitFor(() =>
      expect(result.current.voteOf("zarya", "COUNTER")).toBe("DOWN"),
    );
    expect(result.current.voteOf("zarya", "SYNERGY")).toBeNull();
  });

  it("does not load votes for guests", () => {
    currentUser = null;
    const { result } = renderHook(() => useRelationFeedback("ana"));

    expect(result.current.signedIn).toBe(false);
    expect(fetchRelationVotes).not.toHaveBeenCalled();
  });

  it("saves a vote and withdraws it when the same vote is repeated", async () => {
    const { result } = renderHook(() => useRelationFeedback("ana"));
    await waitFor(() => expect(fetchRelationVotes).toHaveBeenCalled());

    await act(() => result.current.vote("mei", "COUNTER", "UP"));
    expect(saveRelationVote).toHaveBeenCalledWith({
      heroSlug: "ana",
      relatedHeroSlug: "mei",
      type: "COUNTER",
      value: "UP",
    });
    expect(result.current.voteOf("mei", "COUNTER")).toBe("UP");

    await act(() => result.current.vote("mei", "COUNTER", "UP"));
    expect(removeRelationVote).toHaveBeenCalledWith("ana", "mei", "COUNTER");
    expect(result.current.voteOf("mei", "COUNTER")).toBeNull();
  });

  it("rolls the vote back when saving fails", async () => {
    vi.mocked(saveRelationVote).mockRejectedValue(
      Object.assign(new Error("boom"), {
        isAxiosError: true,
        response: { status: 400, data: { message: "Too many votes" } },
      }),
    );
    const { result } = renderHook(() => useRelationFeedback("ana"));
    await waitFor(() => expect(fetchRelationVotes).toHaveBeenCalled());

    await act(() => result.current.vote("mei", "COUNTER", "UP"));

    expect(result.current.voteOf("mei", "COUNTER")).toBeNull();
    expect(result.current.failure).toBe("Too many votes");
  });
});
