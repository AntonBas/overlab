import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../api/feedbackApi", () => ({ sendFeedback: vi.fn() }));

import { sendFeedback } from "../api/feedbackApi";
import { FeedbackPage } from "./FeedbackPage";

function renderPage(url = "/feedback") {
  renderWithRouter(
    <Routes>
      <Route path="/feedback" element={<FeedbackPage />} />
    </Routes>,
    url,
  );
}

describe("FeedbackPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(sendFeedback).mockResolvedValue();
  });

  it("needs a meaningful message before it can be sent", async () => {
    renderPage();
    const send = screen.getByRole("button", { name: "Send" });
    expect(send).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Message"), "too short");
    expect(send).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Message"), " but now longer");
    expect(send).toBeEnabled();
  });

  it("sends the type, the trimmed message and the page it was opened from", async () => {
    renderPage("/feedback?from=%2Fheroes%2Fana");

    await userEvent.selectOptions(
      screen.getByLabelText("What is it about?"),
      "TYPO",
    );
    await userEvent.type(
      screen.getByLabelText("Message"),
      "  Ana has a typo in her story  ",
    );
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(sendFeedback).toHaveBeenCalledWith({
        type: "TYPO",
        message: "Ana has a typo in her story",
        pagePath: "/heroes/ana",
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("was sent");
  });

  it("ignores a from address that leaves the site", async () => {
    renderPage("/feedback?from=https%3A%2F%2Fevil.test");

    await userEvent.type(
      screen.getByLabelText("Message"),
      "Something is wrong here",
    );
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(sendFeedback).toHaveBeenCalledWith(
        expect.objectContaining({ pagePath: null }),
      ),
    );
  });

  it("shows why the message was rejected and keeps the text", async () => {
    vi.mocked(sendFeedback).mockRejectedValue(
      Object.assign(new Error("boom"), {
        isAxiosError: true,
        response: { status: 429, data: { message: "Too many requests" } },
      }),
    );
    renderPage();

    await userEvent.type(
      screen.getByLabelText("Message"),
      "Something is wrong here",
    );
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many requests",
    );
    expect(screen.getByLabelText("Message")).toHaveValue(
      "Something is wrong here",
    );
  });
});
