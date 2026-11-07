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
    roleChange: null,
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
    const genji = screen.getByRole("row", { name: /Genji/ });
    expect(genji).toHaveTextContent("50.0%→53.0%");
  });

  it("reverses the order when the same column is chosen again", async () => {
    const user = userEvent.setup();
    renderWithRouter(<ChangesTable changes={changes} showBan />);

    await user.click(screen.getByRole("button", { name: /Win rate/ }));

    expect(heroNames()).toEqual(["Ana", "Genji"]);
  });

  it("sorts by ban rate change", async () => {
    const user = userEvent.setup();
    const banChanges = [
      change({ banRateChange: -2 }),
      change({ heroSlug: "genji", heroName: "Genji", banRateChange: 3 }),
    ];
    renderWithRouter(<ChangesTable changes={banChanges} showBan />);

    await user.click(screen.getByRole("button", { name: /Ban rate/ }));

    expect(heroNames()).toEqual(["Genji", "Ana"]);
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
      screen.getByText("No heroes match these filters."),
    ).toBeInTheDocument();
  });

  it("flags a hero whose role changed between the snapshots", () => {
    const moved = change({
      heroSlug: "sombra",
      heroName: "Sombra",
      role: "SUPPORT",
      roleChange: {
        changedAt: "2026-11-03T10:00:00Z",
        previousRole: "DAMAGE",
        newRole: "SUPPORT",
      },
    });
    renderWithRouter(<ChangesTable changes={[moved, ...changes]} showBan />);

    const flag = screen.getByText("Role changed");
    expect(flag).toHaveAttribute(
      "title",
      expect.stringContaining("Moved from Damage to Support on 3 Nov 2026"),
    );
    expect(screen.getAllByText("Role changed")).toHaveLength(1);
  });
});
