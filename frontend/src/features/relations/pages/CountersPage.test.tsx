import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, type InitialEntry } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CountersPage } from "./CountersPage";

const extra = vi.hoisted(() => ({ heroes: [] as { slug: string }[] }));

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

vi.mock("../../heroes/api/heroesApi", () => ({
  fetchHeroes: async () => [
    hero("ana", "Ana", "SUPPORT"),
    hero("reaper", "Reaper", "DAMAGE"),
    hero("winston", "Winston", "TANK"),
    ...extra.heroes.map((entry) => hero(entry.slug, entry.slug, "DAMAGE")),
  ],
}));

vi.mock("../api/relationsApi", () => ({
  fetchAllRelations: async () => [
    {
      heroSlug: "ana",
      counters: [
        {
          slug: "reaper",
          name: "Reaper",
          role: "DAMAGE",
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
          note: "Sleep dart stops him",
          portraitUrl: null,
        },
      ],
      synergies: [],
    },
    { heroSlug: "winston", counters: [], counteredBy: [], synergies: [] },
    ...extra.heroes.map((entry) => ({
      heroSlug: entry.slug,
      counters: [
        {
          slug: "ana",
          name: "Ana",
          role: "SUPPORT",
          note: null,
          portraitUrl: null,
        },
      ],
      counteredBy: [],
      synergies: [],
    })),
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

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search} {JSON.stringify(location.state)}
    </output>
  );
}

function renderPage(entry: InitialEntry = "/counters") {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <CountersPage />
      <LocationProbe />
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

  it("shows the note in a tooltip on hover", async () => {
    renderPage();
    await screen.findAllByText("Strong against");
    expect(screen.queryByRole("dialog")).toBeNull();

    const avatar = screen
      .getAllByRole("link", { name: "Reaper" })
      .find((link) => link.classList.contains("relation-avatar"));
    fireEvent.mouseEnter(avatar?.parentElement as Element);

    const tooltip = screen.getByRole("dialog");
    expect(tooltip).toHaveTextContent("Sleep dart stops him");
    expect(tooltip).toHaveTextContent("Reaper");
  });

  it("shows a category chip with its heroes in a tooltip", async () => {
    renderPage();
    await screen.findAllByText("Strong against");

    const chip = screen.getByRole("button", { name: /Dive/ });
    expect(chip).toHaveTextContent("2");
    fireEvent.mouseEnter(chip.parentElement as Element);

    const tooltip = screen.getByRole("dialog");
    expect(tooltip).toHaveTextContent("Hard to peel for");
    expect(tooltip).toHaveTextContent("Winston");
    expect(tooltip).toHaveTextContent("Reaper");
  });

  it("lets a keyboard user reach the links of a category popover and leave it", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Strong against");

    const chip = screen.getByRole("button", { name: /Dive/ });
    chip.focus();
    const popover = await screen.findByRole("dialog");

    await user.tab();
    const links = within(popover).getAllByRole("link");
    expect(links[0]).toHaveFocus();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.tab({ shift: true });
    expect(chip).toHaveFocus();

    await user.tab();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(chip).toHaveFocus();
  });

  it("renders the heroes in steps so the page and its tab order stay small", async () => {
    extra.heroes = Array.from({ length: 30 }, (_, index) => ({
      slug: `hero-${String(index).padStart(2, "0")}`,
    }));
    renderPage();
    await screen.findAllByText("Strong against");

    expect(rows()).toHaveLength(12);
    fireEvent.click(screen.getByRole("button", { name: /Show more heroes/ }));
    expect(rows()).toHaveLength(24);
  });

  it("reads the filters from the address", async () => {
    renderPage("/counters?role=DAMAGE&q=rea");
    await screen.findAllByText("Strong against");

    expect(rows()).toHaveLength(1);
    expect(rows()[0].querySelector("strong")?.textContent).toBe("Reaper");
  });

  it("writes the filters and the revealed rows to the address", async () => {
    extra.heroes = Array.from({ length: 30 }, (_, index) => ({
      slug: `hero-${String(index).padStart(2, "0")}`,
    }));
    renderPage();
    await screen.findAllByText("Strong against");

    fireEvent.click(screen.getByRole("button", { name: /Show more heroes/ }));
    expect(screen.getByTestId("location")).toHaveTextContent('{"rows":24}');

    fireEvent.click(screen.getByRole("button", { name: /only favorites/i }));
    expect(screen.getByTestId("location")).toHaveTextContent(
      '/counters?favorites=1 {"rows":12}',
    );
  });

  it("restores the revealed rows when coming back to the page", async () => {
    extra.heroes = Array.from({ length: 30 }, (_, index) => ({
      slug: `hero-${String(index).padStart(2, "0")}`,
    }));
    renderPage({ pathname: "/counters", state: { rows: 24 } });
    await screen.findAllByText("Strong against");

    expect(rows()).toHaveLength(24);
  });
});
