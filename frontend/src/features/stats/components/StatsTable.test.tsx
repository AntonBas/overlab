import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { heroStat } from "../../../test/fixtures/stats";
import { renderWithRouter } from "../../../test/render";
import { StatsTable } from "./StatsTable";

const heroes = [
  heroStat({ winRateDelta: 1.2, pickRateDelta: -0.4 }),
  heroStat({
    heroSlug: "reinhardt",
    heroName: "Reinhardt",
    role: "TANK",
    winRate: 53.8,
    banRate: null,
  }),
];

function renderTable(props: Partial<Parameters<typeof StatsTable>[0]> = {}) {
  const onSort = vi.fn();
  renderWithRouter(
    <StatsTable
      heroes={heroes}
      showBan
      showDelta={false}
      sort="PICK_RATE"
      direction="DESC"
      onSort={onSort}
      {...props}
    />,
  );
  return onSort;
}

describe("StatsTable", () => {
  it("lists every hero with a link to the hero page", () => {
    renderTable();

    expect(screen.getByRole("link", { name: "Ana" })).toHaveAttribute(
      "href",
      "/heroes/ana",
    );
    expect(screen.getByRole("link", { name: "Reinhardt" })).toHaveAttribute(
      "href",
      "/heroes/reinhardt",
    );
    expect(screen.getByText("47.1%")).toBeInTheDocument();
  });

  it("hides the ban column when bans do not apply", () => {
    renderTable({ showBan: false });

    expect(
      screen.queryByRole("columnheader", { name: /ban rate/i }),
    ).not.toBeInTheDocument();
  });

  it("shows differences from the overall values only on map pages", () => {
    renderTable({ showDelta: true });

    expect(screen.getByText("+1.2")).toBeInTheDocument();
    expect(screen.getByText("−0.4")).toBeInTheDocument();
  });

  it("shows a dash for a missing ban rate", () => {
    renderTable();

    const row = screen.getByRole("link", { name: "Reinhardt" }).closest("tr");
    expect(within(row as HTMLElement).getByText("-")).toBeInTheDocument();
  });

  it("reports which column the visitor wants to sort by", async () => {
    const onSort = renderTable();

    await userEvent.click(screen.getByRole("button", { name: /win rate/i }));

    expect(onSort).toHaveBeenCalledWith("WIN_RATE");
  });

  it("announces the active sort order", () => {
    renderTable({ sort: "WIN_RATE", direction: "ASC" });

    expect(
      screen.getByRole("columnheader", { name: /win rate/i }),
    ).toHaveAttribute("aria-sort", "ascending");
    expect(
      screen.getByRole("columnheader", { name: /pick rate/i }),
    ).toHaveAttribute("aria-sort", "none");
  });

  it("tags a hero that appeared in the last two weeks as new", () => {
    renderTable({
      heroes: [heroStat({ recentlyAdded: true }), heroes[1]],
    });

    expect(screen.getAllByText("New")).toHaveLength(1);
  });
});
