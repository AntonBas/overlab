import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";
import type { User } from "../../../types/api";
import type { RelationFeedback } from "../hooks/useRelationFeedback";

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

import { RelationFeedbackActions } from "./RelationFeedbackActions";

function feedbackStub(
  overrides: Partial<RelationFeedback> = {},
): RelationFeedback {
  return {
    heroSlug: "ana",
    signedIn: true,
    failure: null,
    voteOf: () => null,
    vote: vi.fn().mockResolvedValue(undefined),
    report: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function renderActions(feedback: RelationFeedback) {
  renderWithRouter(
    <Routes>
      <Route
        path="/"
        element={
          <RelationFeedbackActions
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

describe("RelationFeedbackActions", () => {
  it("sends a vote for signed in users", async () => {
    const feedback = feedbackStub();
    currentUser = { id: 7 } as User;
    renderActions(feedback);

    await userEvent.click(
      screen.getByRole("button", { name: "Disagree with Zarya" }),
    );

    expect(feedback.vote).toHaveBeenCalledWith("zarya", "COUNTER", "DOWN");
  });

  it("marks the current vote as pressed", () => {
    currentUser = { id: 7 } as User;
    renderActions(feedbackStub({ voteOf: () => "UP" }));

    expect(
      screen.getByRole("button", { name: "Agree with Zarya" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("sends guests to the login page", async () => {
    currentUser = null;
    const feedback = feedbackStub({ signedIn: false });
    renderActions(feedback);

    await userEvent.click(
      screen.getByRole("button", { name: "Agree with Zarya" }),
    );

    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(feedback.vote).not.toHaveBeenCalled();
  });

  it("needs a meaningful message before a report can be sent", async () => {
    currentUser = { id: 7 } as User;
    const feedback = feedbackStub();
    renderActions(feedback);

    await userEvent.click(
      screen.getByRole("button", { name: "Report a mistake about Zarya" }),
    );
    const send = screen.getByRole("button", { name: "Send" });
    expect(send).toBeDisabled();

    await userEvent.type(
      screen.getByLabelText("What is wrong about Zarya?"),
      "  This counter is outdated  ",
    );
    await userEvent.click(send);

    await waitFor(() =>
      expect(feedback.report).toHaveBeenCalledWith(
        "zarya",
        "COUNTER",
        "This counter is outdated",
      ),
    );
    expect(await screen.findByText("Thanks, we will review it.")).toBeVisible();
  });

  it("keeps the form open and shows the reason when the report is rejected", async () => {
    currentUser = { id: 7 } as User;
    renderActions(
      feedbackStub({
        report: vi.fn().mockResolvedValue("You already have an open report"),
      }),
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Report a mistake about Zarya" }),
    );
    await userEvent.type(
      screen.getByLabelText("What is wrong about Zarya?"),
      "This counter is outdated",
    );
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByText("You already have an open report"),
    ).toBeInTheDocument();
  });
});
