import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";
import type { User } from "../../../types/api";

vi.mock("../api/personalApi", () => ({
  fetchFavorites: vi.fn(),
  fetchPreferences: vi.fn(),
  addFavoriteHero: vi.fn(),
  removeFavoriteHero: vi.fn(),
  addFavoriteMap: vi.fn(),
  removeFavoriteMap: vi.fn(),
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
  addFavoriteHero,
  fetchFavorites,
  fetchPreferences,
  removeFavoriteHero,
} from "../api/personalApi";
import { PersonalDataProvider } from "../context/PersonalDataProvider";
import { FavoriteButton } from "./FavoriteButton";

const signedIn: User = {
  id: 7,
  email: "ana@overlab.gg",
  displayName: "Ana",
  role: "USER",
  provider: "LOCAL",
  emailVerified: true,
};

function renderButton() {
  renderWithRouter(
    <PersonalDataProvider>
      <FavoriteButton kind="hero" slug="ana" name="Ana" />
    </PersonalDataProvider>,
  );
}

function rejection(message: string) {
  return Object.assign(new Error(message), {
    isAxiosError: true,
    response: { status: 400, data: { message } },
  });
}

describe("FavoriteButton", () => {
  beforeEach(() => {
    currentUser = signedIn;
    vi.mocked(fetchFavorites).mockResolvedValue({ heroes: [], maps: [] });
    vi.mocked(fetchPreferences).mockResolvedValue({
      queue: null,
      platform: null,
      region: null,
      tier: null,
    });
    vi.mocked(addFavoriteHero).mockReset();
    vi.mocked(removeFavoriteHero).mockReset();
  });

  it("sends anonymous visitors to the login page", async () => {
    currentUser = null;
    renderWithRouter(
      <Routes>
        <Route
          path="/"
          element={<FavoriteButton kind="hero" slug="ana" name="Ana" />}
        />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Add Ana to favorites" }),
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(addFavoriteHero).not.toHaveBeenCalled();
  });

  it("marks the hero as favorite right away", async () => {
    vi.mocked(addFavoriteHero).mockImplementation(
      () => new Promise<void>(() => undefined),
    );
    renderButton();

    await userEvent.click(
      await screen.findByRole("button", { name: "Add Ana to favorites" }),
    );

    expect(
      screen.getByRole("button", { name: "Remove Ana from favorites" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(addFavoriteHero).toHaveBeenCalledWith("ana");
  });

  it("rolls the star back and shows the error when saving fails", async () => {
    vi.mocked(addFavoriteHero).mockRejectedValue(
      rejection("You can keep at most 200 favorite heroes"),
    );
    renderButton();

    await userEvent.click(
      await screen.findByRole("button", { name: "Add Ana to favorites" }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Add Ana to favorites" }),
      ).toHaveAttribute("aria-pressed", "false"),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "at most 200 favorite heroes",
    );
  });

  it("removes an existing favorite", async () => {
    vi.mocked(fetchFavorites).mockResolvedValue({
      heroes: [
        {
          slug: "ana",
          name: "Ana",
          role: "SUPPORT",
          subrole: null,
          description: null,
          strengths: null,
          weaknesses: null,
          portraitUrl: null,
        },
      ],
      maps: [],
    });
    vi.mocked(removeFavoriteHero).mockResolvedValue();
    renderButton();

    await userEvent.click(
      await screen.findByRole("button", { name: "Remove Ana from favorites" }),
    );

    expect(removeFavoriteHero).toHaveBeenCalledWith("ana");
    expect(
      screen.getByRole("button", { name: "Add Ana to favorites" }),
    ).toBeInTheDocument();
  });
});
