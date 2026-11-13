import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Perk } from "../../../types/hero";
import { PerkList } from "./PerkList";

function perk(overrides: Partial<Perk>): Perk {
  return {
    id: 1,
    heroSlug: "ana",
    name: "Quick Sleep",
    description: null,
    slot: "MAJOR",
    position: "LEFT",
    recommendation: "RECOMMENDED",
    recommendationNote: null,
    iconUrl: null,
    ...overrides,
  };
}

describe("PerkList", () => {
  it("shows minor perks before major perks, as in the game", () => {
    render(
      <PerkList
        perks={[
          perk({ id: 1, name: "Minor one", slot: "MINOR" }),
          perk({ id: 2, name: "Major one", slot: "MAJOR" }),
        ]}
      />,
    );

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Minor perks",
      "Major perks",
    ]);
  });

  it("puts the left perk before the right perk of a tier and says which is which", () => {
    render(
      <PerkList
        perks={[
          perk({ id: 1, name: "Right one", slot: "MINOR", position: "RIGHT" }),
          perk({ id: 2, name: "Left one", slot: "MINOR", position: "LEFT" }),
        ]}
      />,
    );

    const names = screen
      .getAllByRole("listitem")
      .map((item) => item.querySelector("strong")?.textContent);
    expect(names).toEqual(["Left one", "Right one"]);
    expect(screen.getByText("Left perk")).toBeInTheDocument();
    expect(screen.getByText("Right perk")).toBeInTheDocument();
  });

  it("keeps a lone right perk in the right column", () => {
    render(<PerkList perks={[perk({ position: "RIGHT" })]} />);

    expect(screen.getByRole("listitem")).toHaveClass("perk-card--right");
  });

  it("labels the recommendation and shows the note", () => {
    render(
      <PerkList
        perks={[
          perk({
            recommendation: "AVOID",
            recommendationNote: "Rarely worth it",
          }),
        ]}
      />,
    );

    expect(screen.getByText("Avoid")).toHaveClass("tag--avoid");
    expect(screen.getByText("Rarely worth it")).toBeInTheDocument();
  });

  it("skips a slot that has no perks", () => {
    render(<PerkList perks={[perk({ slot: "MAJOR" })]} />);

    expect(screen.queryByText("Minor perks")).not.toBeInTheDocument();
  });

  it("tags a perk that was added recently as new", () => {
    render(
      <PerkList
        perks={[
          perk({ id: 1, name: "Fresh perk", recentlyAdded: true }),
          perk({ id: 2, name: "Old perk" }),
        ]}
      />,
    );

    expect(screen.getAllByText("New")).toHaveLength(1);
  });
});
