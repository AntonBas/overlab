import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../api/heroesApi", () => ({
  fetchHero: vi.fn(),
  fetchHeroes: vi.fn(),
}));
vi.mock("../../stats", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../stats")>()),
  fetchHeroMapStats: vi.fn(),
  useRegion: () => ({ region: "EUROPE" }),
}));
vi.mock("../../maps/api/mapsApi", () => ({
  fetchMaps: vi.fn(() =>
    Promise.resolve([
      { slug: "busan", name: "Busan", mode: "CONTROL", imageUrl: null },
    ]),
  ),
}));

import { fetchHeroMapStats } from "../../stats";
import { fetchHero, fetchHeroes } from "../api/heroesApi";
import { HeroMapsPage } from "./HeroMapsPage";

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
      <Route path="/heroes/:slug/maps" element={<HeroMapsPage />} />
    </Routes>,
    "/heroes/mauga/maps",
  );
}

describe("HeroMapsPage", () => {
  beforeEach(() => {
    vi.mocked(fetchHero).mockResolvedValue(mauga);
    vi.mocked(fetchHeroes).mockResolvedValue([
      mauga,
      { ...mauga, slug: "orisa", name: "Orisa" },
    ]);
  });

  it("shows the hero's best maps and links to the full hero page", async () => {
    vi.mocked(fetchHeroMapStats).mockResolvedValue({
      queue: "COMPETITIVE",
      tier: "ALL",
      platform: "PC",
      region: "EUROPE",
      overall: null,
      maps: [
        {
          mapSlug: "busan",
          mapName: "Busan",
          mode: "CONTROL",
          winRate: 55,
          pickRate: 20,
          banRate: null,
          winRateDelta: 3,
          pickRateDelta: null,
          capturedAt: "2026-10-29T10:00:00Z",
        },
      ],
    } as never);

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Mauga maps" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Best maps for Mauga" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Full Mauga page" }),
    ).toHaveAttribute("href", "/heroes/mauga");
    expect(screen.getByRole("link", { name: /Orisa/ })).toHaveAttribute(
      "href",
      "/heroes/orisa/maps",
    );
  });

  it("says so when no statistics were collected for the hero", async () => {
    vi.mocked(fetchHeroMapStats).mockRejectedValue(
      Object.assign(new Error("missing"), {
        isAxiosError: true,
        response: { status: 404, data: { message: "missing" } },
      }),
    );

    renderPage();

    expect(
      await screen.findByText(
        "No statistics have been collected for this hero yet.",
      ),
    ).toBeInTheDocument();
  });
});
