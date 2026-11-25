import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { HeroCategory, RelatedHero } from "../../../types/hero";
import { RelationTabs } from "./RelationTabs";

function related(slug: string, name: string): RelatedHero {
  return {
    slug,
    name,
    role: "DAMAGE",
    note: null,
    portraitUrl: null,
  };
}

function tile(name: RegExp) {
  return screen.getAllByRole("link", { name })[0];
}

function renderTabs(
  props: Partial<Parameters<typeof RelationTabs>[0]> = {},
  url = "/heroes/dva/counters",
) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/heroes/:slug/counters/:tab?/:related?"
          element={
            <RelationTabs
              heroSlug="dva"
              strongAgainst={[related("pharah", "Pharah")]}
              counteredBy={[
                related("zarya", "Zarya"),
                related("brigitte", "Brigitte"),
              ]}
              synergies={[related("sombra", "Sombra")]}
              {...props}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RelationTabs", () => {
  it("opens the first tab and shows the counts", () => {
    renderTabs();

    expect(screen.getByRole("tab", { name: /Strong against/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("tab", { name: /Struggles against 2/ }),
    ).toBeInTheDocument();
    expect(tile(/Pharah/)).toBeInTheDocument();
    expect(screen.queryAllByRole("link", { name: /Zarya/ })).toHaveLength(0);
  });

  it("switches the list when another tab is chosen", async () => {
    renderTabs();

    await userEvent.click(screen.getByRole("tab", { name: /Works well with/ }));

    expect(tile(/Sombra/)).toBeInTheDocument();
    expect(screen.queryAllByRole("link", { name: /Pharah/ })).toHaveLength(0);
  });

  it("gives every tab and hero its own address", () => {
    renderTabs({}, "/heroes/dva/counters/struggles-against");

    expect(
      screen.getByRole("tab", { name: /Works well with/ }),
    ).toHaveAttribute("href", "/heroes/dva/counters/synergies");
    expect(tile(/Brigitte/)).toHaveAttribute(
      "href",
      "/heroes/dva/counters/struggles-against/brigitte",
    );
  });

  it("shows the hero named in the address and links to its counters", () => {
    renderTabs({}, "/heroes/dva/counters/struggles-against/brigitte");

    expect(
      screen.getByRole("link", { name: /Brigitte/, current: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Brigitte matchup" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Brigitte" }).at(-1),
    ).toHaveAttribute("href", "/heroes/brigitte/counters");
  });

  it("starts on the tab named in the address", () => {
    renderTabs({}, "/heroes/dva/counters/struggles-against");

    expect(tile(/Zarya/)).toBeInTheDocument();
  });

  it("hides empty tabs and falls back to the first one that has heroes", () => {
    renderTabs({ counteredBy: [] });

    expect(
      screen.queryByRole("tab", { name: /Struggles against/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Strong against/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("renders nothing without any heroes", () => {
    renderTabs({ strongAgainst: [], counteredBy: [], synergies: [] });

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("moves between tabs with the arrow keys", async () => {
    renderTabs();

    screen.getByRole("tab", { name: /Strong against/ }).focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(
      screen.getByRole("tab", { name: /Struggles against/ }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("shows a group tile next to the hero tiles and counts it", async () => {
    const flying: HeroCategory = {
      slug: "flying",
      name: "Flying",
      description: null,
      heroes: [
        { slug: "pharah", name: "Pharah", role: "DAMAGE", portraitUrl: null },
      ],
    };
    renderTabs(
      {
        categories: [flying],
        categoryMatchups: [
          {
            heroSlug: "dva",
            categorySlug: "flying",
            type: "WEAK_AGAINST",
            note: null,
          },
        ],
      },
      "/heroes/dva/counters/struggles-against",
    );

    expect(tile(/Flying/)).toBeInTheDocument();
    expect(tile(/Zarya/)).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Struggles against 3/ }),
    ).toBeInTheDocument();
  });

  it("opens a tab that only has a group tile", () => {
    renderTabs({
      strongAgainst: [],
      counteredBy: [],
      synergies: [],
      categories: [
        { slug: "beam", name: "Beam", description: null, heroes: [] },
      ],
      categoryMatchups: [
        {
          heroSlug: "dva",
          categorySlug: "beam",
          type: "WEAK_AGAINST",
          note: null,
        },
      ],
    });

    expect(tile(/Beam/)).toBeInTheDocument();
  });
});
