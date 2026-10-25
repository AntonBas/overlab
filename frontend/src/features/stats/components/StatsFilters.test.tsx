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
  render(<StatsFilters filters={filters} maps={maps} onChange={onChange} />);
  return onChange;
}

describe("StatsFilters", () => {
  it("switches the game mode", async () => {
    const onChange = renderFilters();

    await userEvent.click(screen.getByRole("button", { name: "Quick Play" }));

    expect(onChange).toHaveBeenCalledWith({ queue: "QUICK_PLAY" });
  });

  it("disables the rank filter for Quick Play", () => {
    renderFilters({ ...DEFAULT_FILTERS, queue: "QUICK_PLAY" });

    expect(screen.getByLabelText("Rank")).toBeDisabled();
  });

  it("keeps the rank filter enabled for Competitive", () => {
    renderFilters();

    expect(screen.getByLabelText("Rank")).toBeEnabled();
  });

  it("offers every map and reports the chosen one", async () => {
    const onChange = renderFilters();

    await userEvent.selectOptions(screen.getByLabelText("Map"), "rialto");

    expect(screen.getByRole("option", { name: "Busan" })).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith({ map: "rialto" });
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
