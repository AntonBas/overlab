import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../../test/render";
import type { User } from "../../../../types/user";
import type { RelationFeedback } from "../../hooks/useRelationFeedback";

let currentUser: User | null = null;
vi.mock("../../../auth/context/useAuth", () => ({
  useAuth: () => ({
    user: currentUser,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    replaceUser: vi.fn(),
  }),
}));

import { RelationVoteButtons } from "./RelationVoteButtons";

function feedbackStub(
  overrides: Partial<RelationFeedback> = {},
): RelationFeedback {
  return {
    heroSlug: "ana",
    signedIn: true,
    failure: null,
    voteOf: () => null,
    vote: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderButtons(feedback: RelationFeedback) {
  renderWithRouter(
    <Routes>
      <Route
        path="/"
        element={
          <RelationVoteButtons
            feedback={feedback}
            relatedHeroSlug="zarya"
            relatedHeroName="Zarya"
            type="COUNTER"
          />
        }
      />
      <Route path="/login" element={<p>Login page</p>} />
    </Routes>,
  );
}

describe("RelationVoteButtons", () => {
  it("sends a vote for signed in users", async () => {
    const feedback = feedbackStub();
    currentUser = { id: 7 } as User;
    renderButtons(feedback);

    await userEvent.click(
      screen.getByRole("button", { name: "Disagree with Zarya" }),
    );

    expect(feedback.vote).toHaveBeenCalledWith("zarya", "COUNTER", "DOWN");
  });

  it("marks the current vote as pressed", () => {
    currentUser = { id: 7 } as User;
    renderButtons(feedbackStub({ voteOf: () => "UP" }));

    expect(
      screen.getByRole("button", { name: "Agree with Zarya" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Disagree with Zarya" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("sends guests to the login page", async () => {
    currentUser = null;
    const feedback = feedbackStub({ signedIn: false });
    renderButtons(feedback);

    await userEvent.click(
      screen.getByRole("button", { name: "Agree with Zarya" }),
    );

    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(feedback.vote).not.toHaveBeenCalled();
  });

  it("shows why a vote could not be saved", () => {
    currentUser = { id: 7 } as User;
    renderButtons(feedbackStub({ failure: "Too many votes" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Too many votes");
  });
});
