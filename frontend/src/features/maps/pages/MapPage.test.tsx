import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { heroStat, snapshot } from "../../../test/fixtures";
import { renderWithRouter } from "../../../test/render";

vi.mock("../../stats/api/statsApi", () => ({ fetchStats: vi.fn() }));
vi.mock("../api/mapsApi", () => ({
  fetchMap: vi.fn(() =>
    Promise.resolve({
      slug: "rialto",
      name: "Rialto",
      mode: "ESCORT",
      imageUrl: null,
    }),
  ),
  fetchMaps: vi.fn(() =>
    Promise.resolve([
      { slug: "havana", name: "Havana", mode: "ESCORT", imageUrl: null },
      { slug: "rialto", name: "Rialto", mode: "ESCORT", imageUrl: null },
      { slug: "route-66", name: "Route 66", mode: "ESCORT", imageUrl: null },
      { slug: "busan", name: "Busan", mode: "CONTROL", imageUrl: null },
    ]),
  ),
}));
vi.mock("../../guides/api/guidesApi", () => ({
  fetchGuides: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../../personal/components/FavoriteButton", () => ({
  FavoriteButton: () => null,
}));

import { fetchStats } from "../../stats/api/statsApi";
import { MapPage } from "./MapPage";

const fetchStatsMock = vi.mocked(fetchStats);

function renderPage(route = "/maps/rialto") {
  renderWithRouter(
    <Routes>
      <Route path="/maps/:slug" element={<MapPage />} />
    </Routes>,
    route,
  );
}

describe("MapPage", () => {
  beforeEach(() => {
    fetchStatsMock.mockReset();
    fetchStatsMock.mockResolvedValue(snapshot());
  });

  it("requests the map with the rank from the address", async () => {
    renderPage("/maps/rialto?tier=gold");

    await waitFor(() =>
      expect(fetchStatsMock).toHaveBeenCalledWith(
        expect.objectContaining({ map: "rialto", tier: "GOLD" }),
      ),
    );
  });

  it("loads the map again when another rank is chosen", async () => {
    renderPage();
    await userEvent.click(
      await screen.findByRole("combobox", { name: "Rank" }),
    );
    await userEvent.click(screen.getByRole("option", { name: "Diamond" }));

    await waitFor(() =>
      expect(fetchStatsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ map: "rialto", tier: "DIAMOND" }),
      ),
    );
  });

  it("filters the heroes by name without loading again", async () => {
    renderPage();
    await screen.findByRole("link", { name: "Ana" });
    const calls = fetchStatsMock.mock.calls.length;

    await userEvent.type(screen.getByRole("searchbox"), "gen");

    expect(screen.getByRole("link", { name: "Genji" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ana" })).not.toBeInTheDocument();
    expect(fetchStatsMock.mock.calls.length).toBe(calls);

    await userEvent.type(screen.getByRole("searchbox"), "zzz");

    expect(
      screen.getByText("No heroes match these filters."),
    ).toBeInTheDocument();
  });

  it("lists the biggest gains and the highest win rates of each role", async () => {
    fetchStatsMock.mockResolvedValue(
      snapshot({
        heroes: [
          heroStat({
            heroSlug: "rein",
            heroName: "Reinhardt",
            role: "TANK",
            winRate: 53,
            winRateDelta: 2,
            pickRate: 20,
          }),
          heroStat({
            heroSlug: "ana",
            heroName: "Ana",
            role: "SUPPORT",
            winRate: 52,
            winRateDelta: 1.5,
            pickRate: 20,
          }),
        ],
      }),
    );
    renderPage();

    const tank = await screen.findByRole("region", { name: "tank picks" });
    const support = screen.getByRole("region", { name: "support picks" });

    expect(within(tank).getByText("Biggest gain here")).toBeInTheDocument();
    expect(within(tank).getByText("Highest win rate here")).toBeInTheDocument();
    expect(within(tank).getAllByText("Reinhardt")).toHaveLength(2);
    expect(within(support).getAllByText("Ana")).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: "Best picks on Rialto" }),
    ).toBeInTheDocument();
  });

  it("keeps the best picks of every role when the table is filtered by role", async () => {
    const rein = heroStat({
      heroSlug: "rein",
      heroName: "Reinhardt",
      role: "TANK",
      winRate: 53,
      winRateDelta: 2,
      pickRate: 20,
    });
    const genji = heroStat({
      heroSlug: "genji",
      heroName: "Genji",
      role: "DAMAGE",
      winRate: 51,
      winRateDelta: 1,
      pickRate: 20,
    });
    fetchStatsMock.mockImplementation((filters) =>
      Promise.resolve(
        snapshot({
          heroes: filters.role === "DAMAGE" ? [genji] : [rein, genji],
        }),
      ),
    );
    renderPage("/maps/rialto?role=damage");

    expect(
      await screen.findByRole("region", { name: "tank picks" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "damage picks" })).toBeVisible();
    expect(screen.getByRole("table")).not.toHaveTextContent("Reinhardt");
  });

  it("switches to the worst picks of the map", async () => {
    fetchStatsMock.mockResolvedValue(
      snapshot({
        heroes: [
          heroStat({
            heroSlug: "rein",
            heroName: "Reinhardt",
            role: "TANK",
            winRate: 45,
            winRateDelta: -3,
            pickRate: 20,
          }),
        ],
      }),
    );
    renderPage();
    const tank = await screen.findByRole("region", { name: "tank picks" });
    expect(within(tank).queryByText("Biggest drop here")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Worst picks" }));

    expect(
      screen.getByRole("heading", { name: "Worst picks on Rialto" }),
    ).toBeInTheDocument();
    expect(within(tank).getByText("Biggest drop here")).toBeInTheDocument();
    expect(within(tank).getByText("Lowest win rate here")).toBeInTheDocument();
    expect(within(tank).getAllByText("Reinhardt")).toHaveLength(2);
  });

  it("lists the other maps of the same mode without the neighbour pager", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "More Escort maps" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Other maps" })).toBeNull();
    expect(screen.getByRole("link", { name: /Route 66/ })).toHaveAttribute(
      "href",
      "/maps/route-66",
    );
  });

  it("shows the game mode in the banner", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Rialto" }),
    ).toBeInTheDocument();
    const banner = screen.getByRole("heading", {
      name: "Rialto",
    }).parentElement;
    expect(banner).toHaveTextContent("Escort");
  });

  it("hides the rank in Quick Play", async () => {
    renderPage("/maps/rialto?queue=quick_play");

    await screen.findByRole("button", { name: "Quick Play" });
    expect(screen.queryByRole("combobox", { name: "Rank" })).toBeNull();
  });
});
