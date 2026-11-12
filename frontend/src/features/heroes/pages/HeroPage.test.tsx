import { screen } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";
import { HeroPage } from "./HeroPage";

const api = vi.hoisted(() => ({
  fetchHero: vi.fn(),
  fetchHeroMapStats: vi.fn(),
  fetchPerks: vi.fn(),
  fetchCounters: vi.fn(),
  fetchSynergies: vi.fn(),
  fetchHeroCategories: vi.fn(),
  fetchHeroAbilities: vi.fn(),
  fetchGuides: vi.fn(),
}));

vi.mock("../api/heroesApi", () => ({
  fetchHero: api.fetchHero,
  fetchPerks: api.fetchPerks,
  fetchCounters: api.fetchCounters,
  fetchSynergies: api.fetchSynergies,
  fetchHeroCategories: api.fetchHeroCategories,
  fetchHeroAbilities: api.fetchHeroAbilities,
}));
vi.mock("../../stats/api/statsApi", () => ({
  fetchHeroMapStats: api.fetchHeroMapStats,
}));
vi.mock("../../guides/api/guidesApi", () => ({
  fetchGuides: api.fetchGuides,
}));
vi.mock("../../stats/context/useRegion", () => ({
  useRegion: () => ({ region: "EUROPE" }),
}));
vi.mock("../hooks/useRelationFeedback", () => ({
  useRelationFeedback: () => ({}),
}));
vi.mock("../../history/components/HeroHistorySection", () => ({
  HeroHistorySection: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}));
vi.mock("../../personal/components/FavoriteButton", () => ({
  FavoriteButton: () => <button type="button">Favorite</button>,
}));
vi.mock("../components/relations/RelationTabs", () => ({
  RelationTabs: () => <div>relation tabs</div>,
}));
vi.mock("../components/abilities/AbilityList", () => ({
  AbilityList: () => <div>ability list</div>,
}));
vi.mock("../components/profile/PerkList", () => ({
  PerkList: () => <div>perk list</div>,
}));
vi.mock("../components/profile/HeroMapPicks", () => ({
  HeroMapPicks: () => <div>map picks</div>,
}));
vi.mock("../../guides/components/SpotsSection", () => ({
  SpotsSection: () => <div>spots</div>,
}));

const hero = {
  slug: "ana",
  name: "Ana",
  role: "SUPPORT",
  subrole: "tactician",
  description: "Sniper healer",
  strengths: null,
  weaknesses: null,
  portraitUrl: null,
};

function failure(status: number) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("bad", "ERR", config, null, {
    status,
    data: { message: "Not found" },
    statusText: "",
    headers: {},
    config,
  });
}

function renderPage() {
  return renderWithRouter(
    <Routes>
      <Route path="/heroes/:slug" element={<HeroPage />} />
    </Routes>,
    "/heroes/ana",
  );
}

describe("HeroPage", () => {
  beforeEach(() => {
    api.fetchHero.mockResolvedValue(hero);
    api.fetchHeroMapStats.mockResolvedValue({ overall: null, maps: [] });
    api.fetchPerks.mockResolvedValue([]);
    api.fetchCounters.mockResolvedValue({ counters: [], counteredBy: [] });
    api.fetchSynergies.mockResolvedValue([]);
    api.fetchHeroCategories.mockResolvedValue({
      categories: [],
      matchups: [],
    });
    api.fetchHeroAbilities.mockResolvedValue([]);
    api.fetchGuides.mockResolvedValue([]);
  });

  it("shows the hero name and statistics, hiding sections without data", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Ana", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sniper healer")).toBeInTheDocument();
    expect(screen.getByText("Ana statistics")).toBeInTheDocument();
    expect(screen.queryByText("ability list")).not.toBeInTheDocument();
    expect(screen.queryByText("perk list")).not.toBeInTheDocument();
    expect(screen.queryByText("relation tabs")).not.toBeInTheDocument();
    expect(screen.queryByText("spots")).not.toBeInTheDocument();
  });

  it("renders abilities, perks, relations, maps and spots when they exist", async () => {
    api.fetchHeroAbilities.mockResolvedValue([{ id: 1 }]);
    api.fetchPerks.mockResolvedValue([{ id: 1 }]);
    api.fetchCounters.mockResolvedValue({
      counters: [{ heroSlug: "reaper" }],
      counteredBy: [],
    });
    api.fetchHeroMapStats.mockResolvedValue({
      overall: null,
      maps: [{ map: "numbani" }],
    });
    api.fetchGuides.mockResolvedValue([{ id: 1 }]);

    renderPage();

    expect(await screen.findByText("ability list")).toBeInTheDocument();
    expect(await screen.findByText("perk list")).toBeInTheDocument();
    expect(await screen.findByText("relation tabs")).toBeInTheDocument();
    expect(await screen.findByText("map picks")).toBeInTheDocument();
    expect(await screen.findByText("spots")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Abilities" }),
    ).toBeInTheDocument();
  });

  it("explains when no statistics were collected for the hero", async () => {
    api.fetchHeroMapStats.mockRejectedValue(failure(404));

    renderPage();

    expect(
      await screen.findByText(
        "No statistics have been collected for this hero yet.",
      ),
    ).toBeInTheDocument();
  });

  it("shows an error with retry when the hero cannot be loaded", async () => {
    api.fetchHero.mockRejectedValue(failure(500));

    renderPage();

    expect(
      await screen.findByRole("button", { name: /retry|try again/i }),
    ).toBeInTheDocument();
  });
});
