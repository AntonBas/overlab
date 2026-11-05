import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { HeroCategory, RelatedHero } from "../../../types/api";
import { RelationTabs } from "./RelationTabs";

function related(slug: string, name: string): RelatedHero {
  return {
    slug,
    name,
    role: "DAMAGE",
    strength: 2,
    note: null,
    portraitUrl: null,
  };
}

function renderTabs(
  props: Partial<Parameters<typeof RelationTabs>[0]> = {},
  url = "/heroes/dva",
) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <RelationTabs
        strongAgainst={[related("pharah", "Pharah")]}
        counteredBy={[
          related("zarya", "Zarya"),
          related("brigitte", "Brigitte"),
        ]}
        synergies={[related("sombra", "Sombra")]}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("RelationTabs", () => {
  it("opens the struggles tab first and shows the counts", () => {
    renderTabs();

    expect(
      screen.getByRole("tab", { name: /Struggles against/ }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("tab", { name: /Strong against 1/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Zarya")).toBeInTheDocument();
    expect(screen.queryByText("Pharah")).not.toBeInTheDocument();
  });

  it("switches the list when another tab is chosen", async () => {
    renderTabs();

    await userEvent.click(screen.getByRole("tab", { name: /Works well with/ }));

    expect(screen.getByText("Sombra")).toBeInTheDocument();
    expect(screen.queryByText("Zarya")).not.toBeInTheDocument();
  });

  it("starts on the tab named in the address", () => {
    renderTabs({}, "/heroes/dva?tab=strong");

    expect(screen.getByText("Pharah")).toBeInTheDocument();
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

    screen.getByRole("tab", { name: /Struggles against/ }).focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(
      screen.getByRole("tab", { name: /Works well with/ }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("shows category chips above the hero cards and counts them", async () => {
    const flying: HeroCategory = {
      slug: "flying",
      name: "Flying",
      description: null,
      heroes: [
        { slug: "pharah", name: "Pharah", role: "DAMAGE", portraitUrl: null },
      ],
    };
    renderTabs({
      categories: [flying],
      categoryMatchups: [
        {
          heroSlug: "dva",
          categorySlug: "flying",
          type: "WEAK_AGAINST",
          strength: 2,
          note: null,
        },
      ],
    });

    expect(screen.getByRole("button", { name: /Flying/ })).toBeInTheDocument();
    expect(screen.getByText("Zarya")).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Struggles against 3/ }),
    ).toBeInTheDocument();
  });

  it("opens a tab that only has a category chip", () => {
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
          strength: 3,
          note: null,
        },
      ],
    });

    expect(screen.getByRole("button", { name: /Beam/ })).toBeInTheDocument();
  });
});
