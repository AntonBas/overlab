import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CountersPage } from "./CountersPage";

vi.mock("../../auth/context/useAuth", () => ({
  useAuth: () => ({ user: { id: 1 } }),
}));

vi.mock("../../personal/context/usePersonalData", () => ({
  usePersonalData: () => ({
    favoriteHeroes: new Set(["reaper"]),
    toggleHeroFavorite: vi.fn(),
    failure: null,
  }),
}));

function hero(slug: string, name: string, role: string) {
  return {
    slug,
    name,
    role,
    subrole: null,
    description: null,
    portraitUrl: null,
  };
}

vi.mock("../api/heroesApi", () => ({
  fetchHeroes: async () => [
    hero("ana", "Ana", "SUPPORT"),
    hero("reaper", "Reaper", "DAMAGE"),
    hero("winston", "Winston", "TANK"),
  ],
  fetchAllRelations: async () => [
    {
      heroSlug: "ana",
      counters: [
        {
          slug: "reaper",
          name: "Reaper",
          role: "DAMAGE",
          strength: 3,
          note: "Sleep dart stops him",
          portraitUrl: null,
        },
      ],
      counteredBy: [],
      synergies: [],
    },
    {
      heroSlug: "reaper",
      counters: [],
      counteredBy: [
        {
          slug: "ana",
          name: "Ana",
          role: "SUPPORT",
          strength: 3,
          note: "Sleep dart stops him",
          portraitUrl: null,
        },
      ],
      synergies: [],
    },
    { heroSlug: "winston", counters: [], counteredBy: [], synergies: [] },
  ],
  fetchHeroCategories: async () => ({
    categories: [
      {
        slug: "dive",
        name: "Dive",
        description: "Heroes that jump onto the backline",
        heroes: [
          { slug: "winston", name: "Winston", role: "TANK", portraitUrl: null },
          { slug: "reaper", name: "Reaper", role: "DAMAGE", portraitUrl: null },
        ],
      },
    ],
    matchups: [
      {
        heroSlug: "ana",
        categorySlug: "dive",
        type: "WEAK_AGAINST",
        strength: 2,
        note: "Hard to peel for",
      },
    ],
  }),
}));

function rows() {
  return screen
    .getAllByRole("listitem")
    .filter((row) => row.classList.contains("matchup"));
}

function renderPage() {
  render(
    <MemoryRouter>
      <CountersPage />
    </MemoryRouter>,
  );
}

describe("CountersPage", () => {
  it("shows only heroes that have relations, tanks first", async () => {
    renderPage();
    await screen.findAllByText("Strong against");

    const names = screen
      .getAllByRole("listitem")
      .filter((row) => row.classList.contains("matchup"))
      .map((row) => row.querySelector("strong")?.textContent);
    expect(names).toEqual(["Reaper", "Ana"]);
  });

  it("filters by role and by hero name", async () => {
    renderPage();
    await screen.findAllByText("Strong against");

    fireEvent.click(screen.getByRole("button", { name: "Tank" }));
    expect(
      screen.getByText("No heroes match the filters."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    fireEvent.change(screen.getByPlaceholderText("Search by name"), {
      target: { value: "ana" },
    });
    expect(rows()).toHaveLength(1);
  });

  it("shows only favorite heroes when asked", async () => {
    renderPage();
    await screen.findAllByText("Strong against");

    fireEvent.click(screen.getByRole("button", { name: /only favorites/i }));

    expect(rows()).toHaveLength(1);
    expect(rows()[0].querySelector("strong")?.textContent).toBe("Reaper");
  });

  it("shows the strength and note in a tooltip on hover", async () => {
    renderPage();
    await screen.findAllByText("Strong against");
    expect(screen.queryByRole("tooltip")).toBeNull();

    const avatar = screen
      .getAllByRole("link", { name: "Reaper" })
      .find((link) => link.classList.contains("relation-avatar"));
    fireEvent.mouseEnter(avatar?.parentElement as Element);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Sleep dart stops him");
    expect(tooltip).toHaveTextContent("Reaper");
  });

  it("shows a category chip with its heroes in a tooltip", async () => {
    renderPage();
    await screen.findAllByText("Strong against");

    const chip = screen.getByRole("button", { name: /Dive/ });
    expect(chip).toHaveTextContent("2");
    fireEvent.mouseEnter(chip.parentElement as Element);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Hard to peel for");
    expect(tooltip).toHaveTextContent("Winston");
    expect(tooltip).toHaveTextContent("Reaper");
  });
});
