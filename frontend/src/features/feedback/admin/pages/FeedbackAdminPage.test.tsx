import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../../test/render";

vi.mock("../api/feedbackAdminApi", () => ({
  fetchFeedback: vi.fn(),
  changeFeedbackStatus: vi.fn(),
}));

vi.mock("../../../relations/admin/api/relationsAdminApi", () => ({
  fetchRelationVoteSummary: vi.fn(),
}));

import { changeFeedbackStatus, fetchFeedback } from "../api/feedbackAdminApi";
import { fetchRelationVoteSummary } from "../../../relations/admin";
import { FeedbackAdminPage } from "./FeedbackAdminPage";

const message = {
  id: 5,
  type: "BUG",
  message: "Chart is broken",
  pagePath: "/stats",
  authorName: null,
  contactEmail: "visitor@example.com",
  status: "NEW",
  createdAt: "2026-01-01T10:00:00Z",
  resolvedAt: null,
};

describe("FeedbackAdminPage", () => {
  beforeEach(() => {
    vi.mocked(fetchFeedback).mockReset();
    vi.mocked(fetchFeedback).mockResolvedValue([message] as never);
    vi.mocked(fetchRelationVoteSummary).mockResolvedValue([
      {
        relationId: 1,
        heroSlug: "ana",
        relatedHeroSlug: "reaper",
        type: "COUNTER",
        up: 3,
        down: 9,
      },
    ] as never);
    vi.mocked(changeFeedbackStatus).mockReset();
    vi.mocked(changeFeedbackStatus).mockResolvedValue(undefined as never);
  });

  it("lists new messages and relation votes", async () => {
    renderWithRouter(<FeedbackAdminPage />, "/admin/feedback");

    expect(await screen.findByText("Chart is broken")).toBeInTheDocument();
    expect(fetchFeedback).toHaveBeenCalledWith("NEW");
    expect(screen.getByRole("link", { name: "/stats" })).toBeInTheDocument();
    expect(
      await screen.findByText("ana / reaper (counter)"),
    ).toBeInTheDocument();
  });

  it("resolves a message and reloads the list", async () => {
    renderWithRouter(<FeedbackAdminPage />, "/admin/feedback");

    await userEvent.click(
      await screen.findByRole("button", { name: "Resolve" }),
    );

    expect(changeFeedbackStatus).toHaveBeenCalledWith(5, "RESOLVED");
    expect(fetchFeedback).toHaveBeenCalledTimes(2);
  });

  it("requests messages of the chosen status", async () => {
    renderWithRouter(<FeedbackAdminPage />, "/admin/feedback");
    await screen.findByText("Chart is broken");

    await userEvent.selectOptions(screen.getByLabelText("Status"), "DISMISSED");

    expect(fetchFeedback).toHaveBeenLastCalledWith("DISMISSED");
  });
});
