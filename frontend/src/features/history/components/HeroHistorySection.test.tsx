import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../../stats/api/statsApi", () => ({
  fetchHeroHistory: vi.fn(() => Promise.resolve({ hero: {}, points: [] })),
}));
vi.mock("../../patches/api/patchesApi", () => ({
  fetchPatches: vi.fn(() => Promise.resolve([])),
}));

import { fetchHeroHistory } from "../../stats/api/statsApi";
import { HeroHistorySection } from "./HeroHistorySection";

describe("HeroHistorySection", () => {
  beforeEach(() => {
    vi.mocked(fetchHeroHistory).mockClear();
  });

  it("asks for the history of the hero on one map when a map is given", async () => {
    renderWithRouter(
      <HeroHistorySection slug="ana" mapSlug="busan" queue="COMPETITIVE" />,
    );

    await waitFor(() =>
      expect(fetchHeroHistory).toHaveBeenCalledWith(
        "ana",
        expect.objectContaining({ map: "busan", queue: "COMPETITIVE" }),
      ),
    );
    expect(await screen.findByText(/Not enough data/)).toBeInTheDocument();
  });

  it("asks for all maps without a map", async () => {
    renderWithRouter(<HeroHistorySection slug="ana" queue="COMPETITIVE" />);

    await waitFor(() =>
      expect(fetchHeroHistory).toHaveBeenCalledWith(
        "ana",
        expect.objectContaining({ map: undefined }),
      ),
    );
  });

  it("shows the three statistics as one section you switch between", async () => {
    renderWithRouter(
      <HeroHistorySection
        slug="ana"
        queue="COMPETITIVE"
        title="Statistics"
        current={{
          winRate: 51.2,
          pickRate: 12.3,
          banRate: 7.5,
          capturedAt: "2026-10-29T10:00:00Z",
        }}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Statistics" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Win rate now")).toBeInTheDocument();
    expect(screen.getByText("51.2%")).toBeInTheDocument();

    const switcher = screen.getByRole("group", { name: "Statistic" });
    await userEvent.click(
      within(switcher).getByRole("button", { name: "Pick rate" }),
    );
    expect(screen.getByText("Pick rate now")).toBeInTheDocument();
    expect(screen.getByText("12.3%")).toBeInTheDocument();

    await userEvent.click(
      within(switcher).getByRole("button", { name: "Ban rate" }),
    );
    expect(screen.getByText("Ban rate now")).toBeInTheDocument();
    expect(screen.getByText("7.5%")).toBeInTheDocument();
  });

  it("has no ban rate in Quick Play", async () => {
    renderWithRouter(<HeroHistorySection slug="ana" queue="QUICK_PLAY" />);

    const switcher = await screen.findByRole("group", { name: "Statistic" });

    expect(
      within(switcher).queryByRole("button", { name: "Ban rate" }),
    ).toBeNull();
    expect(within(switcher).getAllByRole("button")).toHaveLength(2);
  });

  it("shows what the page passes in as children", async () => {
    renderWithRouter(
      <HeroHistorySection slug="ana" queue="COMPETITIVE">
        <p>Loading statistics</p>
      </HeroHistorySection>,
    );

    expect(await screen.findByText("Loading statistics")).toBeInTheDocument();
  });
});
