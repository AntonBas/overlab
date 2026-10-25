import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { snapshot } from "../../../test/fixtures";
import { renderWithRouter } from "../../../test/render";
import type { RequestFailure } from "../../../services/api";

vi.mock("../api/statsApi", () => ({ fetchStats: vi.fn() }));
vi.mock("../../maps/api/mapsApi", () => ({
  fetchMaps: vi.fn(() =>
    Promise.resolve([
      { slug: "rialto", name: "Rialto", mode: "ESCORT", imageUrl: null },
    ]),
  ),
}));

import { fetchStats } from "../api/statsApi";
import { StatsPage } from "./StatsPage";

const fetchStatsMock = vi.mocked(fetchStats);

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="search">{location.search}</output>;
}

function renderPage(route = "/stats") {
  renderWithRouter(
    <>
      <Routes>
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
      <LocationProbe />
    </>,
    route,
  );
}

describe("StatsPage", () => {
  beforeEach(() => {
    fetchStatsMock.mockReset();
  });

  it("requests the default filters and shows the heroes", async () => {
    fetchStatsMock.mockResolvedValue(snapshot());

    renderPage();

    expect(
      await screen.findByRole("link", { name: "Ana" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Genji" })).toBeInTheDocument();
    expect(fetchStatsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queue: "COMPETITIVE",
        tier: "ALL",
        map: "all-maps",
        platform: "PC",
        region: "EUROPE",
      }),
    );
    expect(screen.getByText(/Snapshot from/)).toBeInTheDocument();
  });

  it("takes the filters from the address", async () => {
    fetchStatsMock.mockResolvedValue(snapshot());

    renderPage("/stats?tier=gold&map=rialto&role=support");

    await screen.findByRole("link", { name: "Ana" });
    expect(fetchStatsMock).toHaveBeenCalledWith(
      expect.objectContaining({ tier: "GOLD", map: "rialto", role: "SUPPORT" }),
    );
    expect(
      screen.getByText(/difference from the all-maps value/),
    ).toBeInTheDocument();
  });

  it("puts a changed filter into the address and loads again", async () => {
    fetchStatsMock.mockResolvedValue(snapshot());
    renderPage();
    await screen.findByRole("link", { name: "Ana" });

    await userEvent.click(screen.getByRole("button", { name: "Quick Play" }));

    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent(
        "?queue=quick_play",
      ),
    );
    await waitFor(() =>
      expect(fetchStatsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ queue: "QUICK_PLAY", tier: "ALL" }),
      ),
    );
  });

  it("sorts by a column and flips the direction on a second click", async () => {
    fetchStatsMock.mockResolvedValue(snapshot());
    renderPage();
    await screen.findByRole("link", { name: "Ana" });

    await userEvent.click(screen.getByRole("button", { name: /win rate/i }));
    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent("sort=win_rate"),
    );
    await userEvent.click(screen.getByRole("button", { name: /win rate/i }));

    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent("direction=asc"),
    );
  });

  it("explains when no statistics exist for the combination", async () => {
    const failure: RequestFailure = {
      status: 404,
      message: "Statistics not found",
      fieldErrors: {},
      network: false,
    };
    fetchStatsMock.mockRejectedValue(
      Object.assign(new Error("not found"), {
        isAxiosError: true,
        response: { status: 404, data: { message: failure.message } },
      }),
    );

    renderPage("/stats?tier=gold&map=rialto");

    expect(
      await screen.findByText(/No statistics have been collected/),
    ).toBeInTheDocument();
  });

  it("offers a retry after a server error", async () => {
    fetchStatsMock.mockRejectedValueOnce(
      Object.assign(new Error("boom"), {
        isAxiosError: true,
        response: { status: 500, data: { message: "Internal server error" } },
      }),
    );
    fetchStatsMock.mockResolvedValueOnce(snapshot());
    renderPage();

    await userEvent.click(
      await screen.findByRole("button", { name: "Try again" }),
    );

    expect(
      await screen.findByRole("link", { name: "Ana" }),
    ).toBeInTheDocument();
  });
});
