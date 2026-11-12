import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import type { GameMap } from "../../../types/map";
import {
  DEFAULT_FILTERS,
  type Coverage,
  type StatsFilters as Filters,
} from "../filters";
import { CoverageContext } from "../context/coverageContext";
import { StatsFilters } from "./StatsFilters";

const maps: GameMap[] = [
  { slug: "rialto", name: "Rialto", mode: "ESCORT", imageUrl: null },
  { slug: "busan", name: "Busan", mode: "CONTROL", imageUrl: null },
];

const ALL_RANKS = [
  "ALL",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
] as const;

const coverage: Coverage = [
  {
    queue: "COMPETITIVE",
    platform: "PC",
    region: "EUROPE",
    tiers: [...ALL_RANKS],
    mapTiers: [...ALL_RANKS],
  },
  {
    queue: "COMPETITIVE",
    platform: "PC",
    region: "ASIA",
    tiers: [...ALL_RANKS],
    mapTiers: [],
  },
  {
    queue: "COMPETITIVE",
    platform: "CONSOLE",
    region: "EUROPE",
    tiers: ["ALL"],
    mapTiers: [],
  },
];

function renderFilters(
  filters: Filters = DEFAULT_FILTERS,
  currentCoverage: Coverage = coverage,
) {
  const onChange = vi.fn();
  render(
    <CoverageContext.Provider value={currentCoverage}>
      <StatsFilters
        filters={filters}
        maps={maps}
        onChange={onChange}
        search=""
        onSearchChange={vi.fn()}
      />
    </CoverageContext.Provider>,
  );
  return onChange;
}

describe("StatsFilters", () => {
  it("hides the rank filter for Quick Play", () => {
    renderFilters({ ...DEFAULT_FILTERS, queue: "QUICK_PLAY" });

    expect(screen.queryByRole("combobox", { name: "Rank" })).toBeNull();
  });

  it("keeps rank and map enabled for PC in Europe", () => {
    renderFilters();

    expect(screen.getByRole("combobox", { name: "Rank" })).toBeEnabled();
    expect(screen.getByRole("combobox", { name: "Map" })).toBeEnabled();
    expect(screen.queryByText(/not collected/i)).toBeNull();
  });

  it("enables ranks but not maps where only ranks are collected", () => {
    renderFilters({ ...DEFAULT_FILTERS, region: "ASIA" });

    expect(screen.getByRole("combobox", { name: "Rank" })).toBeEnabled();
    expect(screen.getByRole("combobox", { name: "Map" })).toBeDisabled();
    expect(
      screen.getByText(/Map statistics are not collected/i),
    ).toBeInTheDocument();
  });

  it("disables rank and map and explains why where only overall data exists", () => {
    renderFilters({ ...DEFAULT_FILTERS, platform: "CONSOLE" });

    expect(screen.getByRole("combobox", { name: "Rank" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Map" })).toBeDisabled();
    expect(screen.getByText(/Ranks are not collected/i)).toBeInTheDocument();
  });

  it("falls back to the Europe-only rule while coverage is unknown", () => {
    renderFilters({ ...DEFAULT_FILTERS, region: "ASIA" }, null);

    expect(screen.getByRole("combobox", { name: "Rank" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Map" })).toBeDisabled();
  });

  it("shows the rank filter for Competitive", () => {
    renderFilters();

    expect(screen.getByRole("combobox", { name: "Rank" })).toBeInTheDocument();
  });

  it("reports the chosen rank from the list", async () => {
    const onChange = renderFilters();

    await userEvent.click(screen.getByRole("combobox", { name: "Rank" }));
    await userEvent.click(screen.getByRole("option", { name: "Emerald" }));

    expect(onChange).toHaveBeenCalledWith({ tier: "EMERALD" });
  });

  it("offers every map and reports the chosen one", async () => {
    const onChange = renderFilters();

    await userEvent.click(screen.getByRole("combobox", { name: "Map" }));

    expect(screen.getByRole("option", { name: "Busan" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("option", { name: "Rialto" }));
    expect(onChange).toHaveBeenCalledWith({ map: "rialto" });
  });

  it("reports the chosen platform and region", async () => {
    const onChange = renderFilters();

    await userEvent.click(screen.getByRole("combobox", { name: "Platform" }));
    await userEvent.click(screen.getByRole("option", { name: "Console" }));
    await userEvent.click(screen.getByRole("combobox", { name: "Region" }));
    await userEvent.click(screen.getByRole("option", { name: /Asia/ }));

    expect(onChange).toHaveBeenCalledWith({ platform: "CONSOLE" });
    expect(onChange).toHaveBeenCalledWith({ region: "ASIA" });
  });

  it("filters by role and can clear the role again", async () => {
    const onChange = renderFilters({ ...DEFAULT_FILTERS, role: "TANK" });

    await userEvent.click(screen.getByRole("button", { name: "Support" }));
    await userEvent.click(screen.getByRole("button", { name: "All roles" }));

    expect(onChange).toHaveBeenNthCalledWith(1, { role: "SUPPORT" });
    expect(onChange).toHaveBeenNthCalledWith(2, { role: null });
    expect(screen.getByRole("button", { name: "Tank" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
