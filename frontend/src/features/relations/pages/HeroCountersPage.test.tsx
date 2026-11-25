import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../../heroes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../heroes")>()),
  fetchHero: vi.fn(),
  fetchHeroes: vi.fn(),
}));
vi.mock("../api/relationsApi", () => ({
  fetchCounters: vi.fn(),
  fetchSynergies: vi.fn(),
  fetchHeroCategories: vi.fn(),
}));
vi.mock("../hooks/useRelationFeedback", () => ({
  useRelationFeedback: () => undefined,
}));

import { fetchHero, fetchHeroes } from "../../heroes";
import {
  fetchCounters,
  fetchHeroCategories,
  fetchSynergies,
} from "../api/relationsApi";
import { HeroCountersPage } from "./HeroCountersPage";

const mauga = {
  slug: "mauga",
  name: "Mauga",
  role: "TANK" as const,
  subrole: null,
  description: null,
  strengths: null,
  weaknesses: null,
  portraitUrl: null,
};

function renderPage() {
  return renderWithRouter(
    <Routes>
      <Route
        path="/heroes/:slug/counters/:tab?/:related?"
        element={<HeroCountersPage />}
      />
    </Routes>,
    "/heroes/mauga/counters",
  );
}

describe("HeroCountersPage", () => {
  beforeEach(() => {
    vi.mocked(fetchHero).mockResolvedValue(mauga);
    vi.mocked(fetchHeroes).mockResolvedValue([mauga]);
    vi.mocked(fetchHeroCategories).mockResolvedValue({
      categories: [],
      matchups: [],
    });
    vi.mocked(fetchSynergies).mockResolvedValue([]);
  });

  it("shows the hero's counters and links to the full hero page", async () => {
    vi.mocked(fetchCounters).mockResolvedValue({
      counters: [
        {
          slug: "dva",
          name: "D.Va",
          role: "TANK",
          note: "Fast",
          portraitUrl: null,
        },
      ],
      counteredBy: [],
    });

    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Mauga counters and synergies",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Full Mauga page" }),
    ).toHaveAttribute("href", "/heroes/mauga");
    expect(screen.getByRole("tab", { name: /Strong against/ })).toBeVisible();
  });

  it("says so when the hero has no recommendations yet", async () => {
    vi.mocked(fetchCounters).mockResolvedValue({
      counters: [],
      counteredBy: [],
    });

    renderPage();

    expect(
      await screen.findByText("No recommendations for Mauga yet."),
    ).toBeInTheDocument();
  });
});
