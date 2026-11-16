import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hero } from "../../../test/fixtures/heroes";
import { gameMap } from "../../../test/fixtures/maps";
import { renderWithRouter } from "../../../test/render";

const auth = vi.hoisted(() => ({
  state: { user: null as { id: number } | null, loading: false },
}));
const personal = vi.hoisted(() => ({
  toggleHeroFavorite: vi.fn(),
  toggleMapFavorite: vi.fn(),
  favoriteHeroes: new Set<string>(["ana"]),
  favoriteMaps: new Set<string>(["numbani"]),
  preferencesLoaded: true,
  preferencesFailed: false,
  reloadPreferences: vi.fn(),
}));

vi.mock("../../auth/context/useAuth", () => ({
  useAuth: () => auth.state,
}));
vi.mock("../context/usePersonalData", () => ({
  usePersonalData: () => personal,
}));
vi.mock("../api/personalApi", () => ({
  fetchFavorites: vi.fn(),
}));
vi.mock("../../account/components/AccountHeader", () => ({
  AccountHeader: () => <div>account header</div>,
}));
vi.mock("../components/PreferencesForm", () => ({
  PreferencesForm: () => <div>preferences form</div>,
}));

import { fetchFavorites } from "../api/personalApi";
import { MyLibraryPage } from "./MyLibraryPage";

function renderPage() {
  return renderWithRouter(
    <Routes>
      <Route path="/login" element={<p>login page</p>} />
      <Route path="/me" element={<MyLibraryPage />} />
    </Routes>,
    "/me",
  );
}

describe("MyLibraryPage", () => {
  beforeEach(() => {
    auth.state = { user: { id: 1 }, loading: false };
    personal.toggleHeroFavorite.mockReset();
    personal.toggleMapFavorite.mockReset();
    personal.preferencesFailed = false;
    personal.reloadPreferences.mockReset();
    vi.mocked(fetchFavorites).mockReset();
  });

  it("redirects anonymous visitors to the login page", () => {
    auth.state = { user: null, loading: false };

    renderPage();

    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("lists favorite heroes and maps and removes them on request", async () => {
    vi.mocked(fetchFavorites).mockResolvedValue({
      heroes: [hero({ subrole: null })],
      maps: [gameMap({ slug: "numbani", name: "Numbani", mode: "HYBRID" })],
    });

    renderPage();

    expect(await screen.findByRole("link", { name: "Ana" })).toHaveAttribute(
      "href",
      "/heroes/ana",
    );
    expect(screen.getByRole("link", { name: "Numbani" })).toHaveAttribute(
      "href",
      "/maps/numbani",
    );
    expect(screen.getByText("preferences form")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remove Ana" }));
    expect(personal.toggleHeroFavorite).toHaveBeenCalledWith("ana");
    await userEvent.click(
      screen.getByRole("button", { name: "Remove Numbani" }),
    );
    expect(personal.toggleMapFavorite).toHaveBeenCalledWith("numbani");
  });

  it("shows hints when there are no favorites", async () => {
    vi.mocked(fetchFavorites).mockResolvedValue({
      heroes: [],
      maps: [],
    });

    renderPage();

    expect(
      await screen.findByText("Use the star on a hero page to keep it here."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Use the star on a map page to keep it here."),
    ).toBeInTheDocument();
  });

  it("does not offer the filters form when the saved filters could not be loaded", async () => {
    vi.mocked(fetchFavorites).mockResolvedValue({ heroes: [], maps: [] });
    personal.preferencesFailed = true;
    renderPage();

    expect(
      await screen.findByText("Your saved filters could not be loaded."),
    ).toBeInTheDocument();
    expect(screen.queryByText("preferences form")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(personal.reloadPreferences).toHaveBeenCalled();
  });
});
