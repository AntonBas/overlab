import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import type { GameMap } from "../../../types/api";
import { DEFAULT_FILTERS, type StatsFilters as Filters } from "../filters";
import { StatsFilters } from "./StatsFilters";

const maps: GameMap[] = [
  { slug: "rialto", name: "Rialto", mode: "ESCORT", imageUrl: null },
  { slug: "busan", name: "Busan", mode: "CONTROL", imageUrl: null },
];

function renderFilters(filters: Filters = DEFAULT_FILTERS) {
  const onChange = vi.fn();
  render(
    <StatsFilters
      filters={filters}
      maps={maps}
      onChange={onChange}
      search=""
      onSearchChange={vi.fn()}
    />,
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
    expect(screen.queryByText(/available for PC in Europe only/i)).toBeNull();
  });

  it("disables rank and map for other regions and explains why", () => {
    renderFilters({ ...DEFAULT_FILTERS, region: "ASIA" });

    expect(screen.getByRole("combobox", { name: "Rank" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Map" })).toBeDisabled();
    expect(
      screen.getByText(/available for PC in Europe only/i),
    ).toBeInTheDocument();
  });

  it("disables rank and map for console", () => {
    renderFilters({ ...DEFAULT_FILTERS, platform: "CONSOLE" });

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
