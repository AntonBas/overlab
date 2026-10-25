import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { HeroChange } from "../../../types/api";
import { renderWithRouter } from "../../../test/render";
import { ChangesTable } from "./ChangesTable";

function change(overrides: Partial<HeroChange>): HeroChange {
  return {
    heroSlug: "ana",
    heroName: "Ana",
    role: "SUPPORT",
    winRateBefore: 47,
    winRateAfter: 45.5,
    winRateChange: -1.5,
    pickRateBefore: 10,
    pickRateAfter: 14,
    pickRateChange: 4,
    banRateBefore: 5,
    banRateAfter: 5,
    banRateChange: 0,
    ...overrides,
  };
}

const changes = [
  change({}),
  change({
    heroSlug: "genji",
    heroName: "Genji",
    role: "DAMAGE",
    winRateBefore: 50,
    winRateAfter: 53,
    winRateChange: 3,
    pickRateChange: -2,
  }),
];

function heroNames() {
  return screen
    .getAllByRole("rowheader")
    .map((header) => within(header).getByRole("link").textContent);
}

describe("ChangesTable", () => {
  it("lists the biggest win rate gain first and shows before and after values", () => {
    renderWithRouter(<ChangesTable changes={changes} showBan />);

    expect(heroNames()).toEqual(["Genji", "Ana"]);
    expect(screen.getByText(/50.0% → 53.0%/)).toBeInTheDocument();
  });

  it("reverses the order when the same column is chosen again", async () => {
    const user = userEvent.setup();
    renderWithRouter(<ChangesTable changes={changes} showBan />);

    await user.click(screen.getByRole("button", { name: /Win rate/ }));

    expect(heroNames()).toEqual(["Ana", "Genji"]);
  });

  it("filters by role", async () => {
    const user = userEvent.setup();
    renderWithRouter(<ChangesTable changes={changes} showBan />);

    await user.click(screen.getByRole("button", { name: "Damage" }));

    expect(heroNames()).toEqual(["Genji"]);
  });

  it("hides the ban column when not needed and handles an empty comparison", () => {
    const { unmount } = renderWithRouter(
      <ChangesTable changes={changes} showBan={false} />,
    );
    expect(
      screen.queryByRole("columnheader", { name: "Ban rate" }),
    ).not.toBeInTheDocument();
    unmount();

    renderWithRouter(<ChangesTable changes={[]} showBan />);
    expect(
      screen.getByText("No heroes appear in both snapshots."),
    ).toBeInTheDocument();
  });
});
