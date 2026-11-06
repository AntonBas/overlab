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
      screen.getByRole("heading", { name: "Best picks on this map" }),
    ).toBeInTheDocument();
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
      screen.getByRole("heading", { name: "Worst picks on this map" }),
    ).toBeInTheDocument();
    expect(within(tank).getByText("Biggest drop here")).toBeInTheDocument();
    expect(within(tank).getByText("Lowest win rate here")).toBeInTheDocument();
    expect(within(tank).getAllByText("Reinhardt")).toHaveLength(2);
  });

  it("links to the neighbouring maps and to other maps of the same mode", async () => {
    renderPage();

    const pager = await screen.findByRole("navigation", { name: "Other maps" });

    expect(within(pager).getByRole("link", { name: /Havana/ })).toHaveAttribute(
      "href",
      "/maps/havana",
    );
    expect(
      within(pager).getByRole("link", { name: /Route 66/ }),
    ).toHaveAttribute("href", "/maps/route-66");
    expect(
      await screen.findByRole("heading", { name: "More Escort maps" }),
    ).toBeInTheDocument();
  });

  it("describes the game mode in a tooltip", async () => {
    renderPage();

    const chip = await screen.findByRole("button", { name: "Escort" });

    expect(chip).toHaveAccessibleDescription(/payload/);
  });

  it("disables the rank in Quick Play", async () => {
    renderPage("/maps/rialto?queue=quick_play");

    expect(
      await screen.findByRole("combobox", { name: "Rank" }),
    ).toBeDisabled();
  });
});
