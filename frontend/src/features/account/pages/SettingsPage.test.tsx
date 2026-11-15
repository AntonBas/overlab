import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { user } from "../../../test/fixtures/auth";
import { renderWithRouter } from "../../../test/render";
import type { User } from "../../../types/user";

vi.mock("../api/accountApi", () => ({
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  requestEmailChange: vi.fn(),
  exportAccount: vi.fn(),
  deleteAccount: vi.fn(() => Promise.resolve()),
}));

const replaceUser = vi.fn();
let currentUser: User | null = null;
vi.mock("../../auth/context/useAuth", () => ({
  useAuth: () => ({
    user: currentUser,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    replaceUser,
  }),
}));

import { deleteAccount, updateProfile } from "../api/accountApi";
import { SettingsPage } from "./SettingsPage";

const localUser: User = user();

function renderSettings() {
  renderWithRouter(
    <Routes>
      <Route path="/me/settings" element={<SettingsPage />} />
      <Route path="/login" element={<p>login page</p>} />
      <Route path="/stats" element={<p>stats page</p>} />
    </Routes>,
    "/me/settings",
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    replaceUser.mockReset();
    vi.mocked(updateProfile).mockReset();
    vi.mocked(deleteAccount).mockClear();
  });

  it("sends anonymous visitors to the sign-in page", () => {
    currentUser = null;
    renderSettings();

    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("shows password and email forms for local accounts", () => {
    currentUser = localUser;
    renderSettings();

    expect(
      screen.getByRole("heading", { name: "Password" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Email" })).toBeInTheDocument();
  });

  it("hides password and email forms for Google accounts", () => {
    currentUser = { ...localUser, provider: "GOOGLE" };
    renderSettings();

    expect(
      screen.queryByRole("heading", { name: "Password" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/signs in with Google/)).toBeInTheDocument();
  });

  it("saves the new display name into the session", async () => {
    currentUser = localUser;
    vi.mocked(updateProfile).mockResolvedValue({
      ...localUser,
      displayName: "Ana B",
    });
    renderSettings();

    const field = screen.getByLabelText("Display name");
    await userEvent.clear(field);
    await userEvent.type(field, "Ana B");
    await userEvent.click(screen.getByRole("button", { name: "Save name" }));

    expect(updateProfile).toHaveBeenCalledWith("Ana B");
    await waitFor(() =>
      expect(replaceUser).toHaveBeenCalledWith({
        ...localUser,
        displayName: "Ana B",
      }),
    );
  });

  it("asks for the password before deleting and signs out afterwards", async () => {
    currentUser = localUser;
    renderSettings();

    await userEvent.click(
      screen.getByRole("button", { name: "Delete my account" }),
    );
    const confirm = screen.getByRole("button", { name: "Delete permanently" });
    expect(confirm).toBeDisabled();

    await userEvent.type(
      screen.getByLabelText("Enter your password to confirm"),
      "secret-password",
    );
    await userEvent.click(confirm);

    expect(deleteAccount).toHaveBeenCalledWith("secret-password", null);
    expect(await screen.findByText("stats page")).toBeInTheDocument();
    expect(replaceUser).toHaveBeenCalledWith(null);
  });
});
