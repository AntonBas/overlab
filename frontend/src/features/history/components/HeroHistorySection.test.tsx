import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../../stats/api/statsApi", () => ({
  fetchFreshness: vi.fn(() =>
    Promise.resolve({
      capturedAt: "2026-10-29T10:00:00Z",
      lastCheckedAt: "2026-10-29T10:00:00Z",
      valuesSince: "2026-10-29T10:00:00Z",
      snapshotCount: 1,
      changeObserved: false,
    }),
  ),
  fetchHeroHistory: vi.fn(() => Promise.resolve({ hero: {}, points: [] })),
}));
vi.mock("../../patches/api/patchesApi", () => ({
  fetchPatches: vi.fn(() => Promise.resolve([])),
}));

import { fetchHeroHistory } from "../../stats";
import { HeroHistorySection } from "./HeroHistorySection";

describe("HeroHistorySection", () => {
  beforeEach(() => {
    vi.mocked(fetchHeroHistory).mockClear();
  });

  it("asks for the history of the hero on one map when a map is given", async () => {
    renderWithRouter(
      <HeroHistorySection
        slug="ana"
        mapSlug="busan"
        queue="COMPETITIVE"
        region="EUROPE"
      />,
    );

    await waitFor(() =>
      expect(fetchHeroHistory).toHaveBeenCalledWith(
        "ana",
        expect.objectContaining({ map: "busan", queue: "COMPETITIVE" }),
      ),
    );
    expect(await screen.findByText(/Not enough data/)).toBeInTheDocument();
  });

  it("lets the period be changed even when there is no data to chart", async () => {
    renderWithRouter(
      <HeroHistorySection slug="ana" queue="COMPETITIVE" region="EUROPE" />,
    );

    await screen.findByText(/Not enough data/);
    await userEvent.click(screen.getByRole("combobox", { name: "Period" }));
    await userEvent.click(screen.getByRole("option", { name: "Last 7 days" }));

    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "Period" }),
      ).toHaveTextContent("Last 7 days"),
    );
  });

  it("asks for all maps without a map", async () => {
    renderWithRouter(
      <HeroHistorySection slug="ana" queue="COMPETITIVE" region="EUROPE" />,
    );

    await waitFor(() =>
      expect(fetchHeroHistory).toHaveBeenCalledWith(
        "ana",
        expect.objectContaining({ map: undefined }),
      ),
    );
  });

  it("switches one chart between win, pick and ban rate", async () => {
    renderWithRouter(
      <HeroHistorySection
        slug="ana"
        queue="COMPETITIVE"
        region="EUROPE"
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
    const switcher = screen.getByRole("group", { name: "Statistic" });
    expect(
      within(switcher).getByRole("button", { name: /^Win rate/ }),
    ).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(
      within(switcher).getByRole("button", { name: /^Pick rate/ }),
    );
    expect(
      within(switcher).getByRole("button", { name: /^Pick rate/ }),
    ).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(
      within(switcher).getByRole("button", { name: /^Ban rate/ }),
    );
    expect(
      within(switcher).getByRole("button", { name: /^Ban rate/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("disables ban rate in Quick Play", async () => {
    renderWithRouter(
      <HeroHistorySection slug="ana" queue="QUICK_PLAY" region="EUROPE" />,
    );

    const switcher = await screen.findByRole("group", { name: "Statistic" });

    expect(
      within(switcher).getByRole("button", { name: /^Ban rate/ }),
    ).toBeDisabled();
    expect(
      within(switcher).getByRole("button", { name: /^Win rate/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("shows what the page passes in as children", async () => {
    renderWithRouter(
      <HeroHistorySection slug="ana" queue="COMPETITIVE" region="EUROPE">
        <p>Loading statistics</p>
      </HeroHistorySection>,
    );

    expect(await screen.findByText("Loading statistics")).toBeInTheDocument();
  });
});
