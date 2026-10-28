import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { snapshot } from "../../../test/fixtures";
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
    await screen.findByRole("combobox", { name: "Rank" });

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Rank" }),
      "DIAMOND",
    );

    await waitFor(() =>
      expect(fetchStatsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ map: "rialto", tier: "DIAMOND" }),
      ),
    );
  });

  it("disables the rank in Quick Play", async () => {
    renderPage("/maps/rialto?queue=quick_play");

    expect(
      await screen.findByRole("combobox", { name: "Rank" }),
    ).toBeDisabled();
  });
});
