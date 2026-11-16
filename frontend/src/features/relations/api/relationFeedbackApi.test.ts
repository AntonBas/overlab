import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import {
  fetchRelationVotes,
  removeRelationVote,
  saveRelationVote,
} from "./relationFeedbackApi";

describe("relationFeedbackApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads, saves and removes the votes of the signed-in user", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: null });
    const remove = vi.spyOn(api, "delete").mockResolvedValue({ data: null });
    const vote = {
      heroSlug: "ana",
      relatedHeroSlug: "reaper",
      type: "COUNTER",
      value: "UP",
    } as const;

    await fetchRelationVotes();
    await saveRelationVote(vote);
    await removeRelationVote("ana", "reaper", "COUNTER");

    expect(get).toHaveBeenCalledWith("/me/relation-votes");
    expect(put).toHaveBeenCalledWith("/me/relation-votes", vote);
    expect(remove).toHaveBeenCalledWith("/me/relation-votes", {
      params: { heroSlug: "ana", relatedHeroSlug: "reaper", type: "COUNTER" },
    });
  });
});
