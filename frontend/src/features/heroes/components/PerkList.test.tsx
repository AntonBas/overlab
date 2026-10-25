import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Perk } from "../../../types/api";
import { PerkList } from "./PerkList";

function perk(overrides: Partial<Perk>): Perk {
  return {
    id: 1,
    heroSlug: "ana",
    name: "Quick Sleep",
    description: null,
    slot: "MAJOR",
    recommendation: "RECOMMENDED",
    recommendationNote: null,
    ...overrides,
  };
}

describe("PerkList", () => {
  it("shows major perks before minor perks", () => {
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
      "Major perks",
      "Minor perks",
    ]);
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
});
