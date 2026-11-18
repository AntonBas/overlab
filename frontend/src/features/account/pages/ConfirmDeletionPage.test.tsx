import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

const auth = vi.hoisted(() => ({
  state: {
    user: { email: "ana@example.test" } as { email: string } | null,
    loading: false,
    replaceUser: vi.fn(),
  },
}));

vi.mock("../../auth", () => ({ useAuth: () => auth.state }));
vi.mock("../api/accountApi", () => ({
  deleteAccount: vi.fn(() => Promise.resolve()),
}));

import { deleteAccount } from "../api/accountApi";
import { ConfirmDeletionPage } from "./ConfirmDeletionPage";

function renderPage(route: string) {
  return renderWithRouter(
    <Routes>
      <Route path="/login" element={<p>login page</p>} />
      <Route path="/stats" element={<p>stats page</p>} />
      <Route path="/confirm-deletion" element={<ConfirmDeletionPage />} />
    </Routes>,
    route,
  );
}

describe("ConfirmDeletionPage", () => {
  beforeEach(() => {
    vi.mocked(deleteAccount).mockClear();
    auth.state = {
      user: { email: "ana@example.test" },
      loading: false,
      replaceUser: vi.fn(),
    };
  });

  it("deletes the account with the token from the link", async () => {
    renderPage("/confirm-deletion?token=abc");

    await userEvent.click(
      screen.getByRole("button", { name: "Delete permanently" }),
    );

    expect(deleteAccount).toHaveBeenCalledWith(null, "abc");
    expect(await screen.findByText("stats page")).toBeInTheDocument();
  });

  it("asks a signed out visitor to sign in first", () => {
    auth.state = { user: null, loading: false, replaceUser: vi.fn() };

    renderPage("/confirm-deletion?token=abc");

    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("reports an incomplete link", () => {
    renderPage("/confirm-deletion");

    expect(screen.getByRole("alert")).toHaveTextContent("incomplete");
  });
});
