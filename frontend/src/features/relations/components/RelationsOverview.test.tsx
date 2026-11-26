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
          heroSlug="mauga"
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
      "/heroes/mauga/counters/strong-against",
    );
    expect(screen.getByRole("link", { name: /Hero 0/ })).toHaveAttribute(
      "href",
      "/heroes/mauga/counters/strong-against/hero-0",
    );
    expect(screen.getByRole("link", { name: "All counters" })).toHaveAttribute(
      "href",
      "/heroes/mauga/counters",
    );
  });

  it("shows an individual hero even when a category of the row includes them", () => {
    render(
      <MemoryRouter>
        <RelationsOverview
          heroSlug="mauga"
          heroName="Mauga"
          strongAgainst={[]}
          counteredBy={[hero(1)]}
          synergies={[]}
          categories={[
            {
              slug: "control",
              name: "Crowd control",
              description: null,
              heroes: [
                {
                  slug: "hero-1",
                  name: "Hero 1",
                  role: "TANK",
                  portraitUrl: null,
                },
              ],
            },
          ]}
          categoryMatchups={[
            {
              heroSlug: "mauga",
              categorySlug: "control",
              type: "WEAK_AGAINST",
              note: null,
            },
          ]}
          moreHref="/heroes/mauga/counters"
        />
      </MemoryRouter>,
    );

    expect(
      document.querySelector(
        'a.relation-avatar[href="/heroes/mauga/counters/struggles-against/hero-1"]',
      ),
    ).toBeInTheDocument();
  });
});
