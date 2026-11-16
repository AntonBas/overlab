import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { hero as heroFixture } from "../../../test/fixtures/heroes";
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
}));
vi.mock("../../perks/api/perksApi", () => ({
  fetchPerks: api.fetchPerks,
}));
vi.mock("../../relations/api/relationsApi", () => ({
  fetchCounters: api.fetchCounters,
  fetchSynergies: api.fetchSynergies,
  fetchHeroCategories: api.fetchHeroCategories,
}));
vi.mock("../../abilities/api/abilitiesApi", () => ({
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
vi.mock("../../relations/hooks/useRelationFeedback", () => ({
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
vi.mock("../../relations/components/RelationTabs", () => ({
  RelationTabs: () => <div>relation tabs</div>,
}));
vi.mock("../../abilities/components/AbilityList", () => ({
  AbilityList: () => <div>ability list</div>,
}));
vi.mock("../../perks/components/PerkList", () => ({
  PerkList: () => <div>perk list</div>,
}));
vi.mock("../components/HeroMapPicks", () => ({
  HeroMapPicks: () => <div>map picks</div>,
}));
vi.mock("../../guides/components/SpotsSection", () => ({
  SpotsSection: () => <div>spots</div>,
}));

const hero = heroFixture();

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

  it("has no accessibility violations", async () => {
    const { container } = renderPage();

    await screen.findByRole("heading", { name: "Ana", level: 1 });

    expect(await axe(container)).toHaveNoViolations();
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

  it("tells the visitor when a secondary section could not be loaded and retries it", async () => {
    api.fetchPerks.mockRejectedValueOnce(failure(500));

    renderPage();

    expect(
      await screen.findByText(
        "Some sections of this page could not be loaded.",
      ),
    ).toBeInTheDocument();
    const callsBefore = api.fetchPerks.mock.calls.length;
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(api.fetchPerks.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it("keeps an unknown hero out of the search index", async () => {
    api.fetchHero.mockRejectedValue(failure(404));

    renderPage();

    await screen.findByRole("alert");
    await waitFor(() =>
      expect(
        document.head
          .querySelector('meta[name="robots"]')
          ?.getAttribute("content"),
      ).toBe("noindex, nofollow"),
    );
  });

  it("shows an error with retry when the hero cannot be loaded", async () => {
    api.fetchHero.mockRejectedValue(failure(500));

    renderPage();

    expect(
      await screen.findByRole("button", { name: /retry|try again/i }),
    ).toBeInTheDocument();
  });
});
