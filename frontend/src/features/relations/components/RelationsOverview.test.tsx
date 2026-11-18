import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { RelatedHero } from "../../../types/hero";
import { RelationsOverview } from "./RelationsOverview";

function hero(index: number): RelatedHero {
  return {
    slug: `hero-${index}`,
    name: `Hero ${index}`,
    role: "TANK",
    portraitUrl: null,
    note: null,
  } as RelatedHero;
}

describe("RelationsOverview", () => {
  it("shows a limited number of heroes per row with a link to the rest", () => {
    const many = Array.from({ length: 9 }, (_, index) => hero(index));
    render(
      <MemoryRouter>
        <RelationsOverview
          heroName="Mauga"
          strongAgainst={many}
          counteredBy={[]}
          synergies={[]}
          moreHref="/heroes/mauga/counters"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Strong against")).toBeInTheDocument();
    expect(screen.queryByText("Struggles against")).not.toBeInTheDocument();
    expect(screen.getByText("Hero 5")).toBeInTheDocument();
    expect(screen.queryByText("Hero 6")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+3" })).toHaveAttribute(
      "href",
      "/heroes/mauga/counters",
    );
    expect(screen.getByRole("link", { name: "All counters" })).toHaveAttribute(
      "href",
      "/heroes/mauga/counters",
    );
  });
});
