import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../../heroes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../heroes")>()),
  fetchHero: vi.fn(),
  fetchHeroes: vi.fn(),
}));
vi.mock("../api/perksApi", () => ({ fetchPerks: vi.fn() }));

import { fetchHero, fetchHeroes } from "../../heroes";
import { fetchPerks } from "../api/perksApi";
import { HeroPerksPage } from "./HeroPerksPage";

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
      <Route path="/heroes/:slug/perks" element={<HeroPerksPage />} />
    </Routes>,
    "/heroes/mauga/perks",
  );
}

describe("HeroPerksPage", () => {
  beforeEach(() => {
    vi.mocked(fetchHero).mockResolvedValue(mauga);
    vi.mocked(fetchHeroes).mockResolvedValue([
      mauga,
      { ...mauga, slug: "orisa", name: "Orisa" },
    ]);
    vi.mocked(fetchPerks).mockResolvedValue([
      {
        id: 1,
        heroSlug: "mauga",
        name: "Heavy Hitter",
        description: "More damage",
        slot: "MINOR",
        position: "LEFT",
        recommendation: "RECOMMENDED",
        recommendationNote: null,
        iconUrl: null,
      },
    ]);
  });

  it("shows the hero's perks and links back to the full hero page", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Mauga perks" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Heavy Hitter")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Full Mauga page" }),
    ).toHaveAttribute("href", "/heroes/mauga");
  });

  it("lists other heroes of the same role that open their perks", async () => {
    renderPage();

    const orisa = await screen.findByRole("link", { name: /Orisa/ });
    expect(orisa).toHaveAttribute("href", "/heroes/orisa/perks");
  });
});
