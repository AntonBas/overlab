import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation, type InitialEntry } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PerksPage } from "./PerksPage";

const extra = vi.hoisted(() => ({ slugs: [] as string[] }));

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

vi.mock("../../heroes/api/heroesApi", () => ({
  fetchHeroes: async () => [
    {
      slug: "ana",
      name: "Ana",
      role: "SUPPORT",
      subrole: null,
      description: null,
      portraitUrl: null,
    },
    {
      slug: "reaper",
      name: "Reaper",
      role: "DAMAGE",
      subrole: null,
      description: null,
      portraitUrl: null,
    },
    ...extra.slugs.map((slug) => ({
      slug,
      name: slug,
      role: "DAMAGE",
      subrole: null,
      description: null,
      portraitUrl: null,
    })),
  ],
}));

vi.mock("../api/perksApi", () => ({
  fetchAllPerks: async () => [
    {
      id: 2,
      heroSlug: "reaper",
      name: "Death Blossom",
      description: null,
      slot: "MINOR",
      position: "LEFT",
      recommendation: "OPTIONAL",
      recommendationNote: null,
      iconUrl: null,
    },
    {
      id: 1,
      heroSlug: "ana",
      name: "Sharp Eye",
      description: "Better aim",
      slot: "MINOR",
      position: "LEFT",
      recommendation: "RECOMMENDED",
      recommendationNote: "Take it on ranged maps",
      iconUrl: null,
    },
    ...extra.slugs.map((slug, index) => ({
      id: 100 + index,
      heroSlug: slug,
      name: `${slug} perk`,
      description: null,
      slot: "MINOR",
      position: "LEFT",
      recommendation: "OPTIONAL",
      recommendationNote: null,
      iconUrl: null,
    })),
  ],
}));

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search} {JSON.stringify(location.state)}
    </output>
  );
}

function renderAt(entry: InitialEntry) {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <PerksPage />
      <LocationProbe />
    </MemoryRouter>,
  );
}

function manyHeroes() {
  extra.slugs = Array.from(
    { length: 30 },
    (_, index) => `hero-${String(index).padStart(2, "0")}`,
  );
}

describe("PerksPage", () => {
  afterEach(() => {
    extra.slugs = [];
  });

  it("shows the heroes that have perks", async () => {
    render(
      <MemoryRouter>
        <PerksPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText("Sharp Eye")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Reaper")).toBeInTheDocument();
  });

  it("lists tanks, then damage, then support, each by name", async () => {
    render(
      <MemoryRouter>
        <PerksPage />
      </MemoryRouter>,
    );
    await screen.findByText("Sharp Eye");

    const names = screen
      .getAllByRole("article")
      .map((card) => card.querySelector("strong")?.textContent);
    expect(names).toEqual(["Reaper", "Ana"]);
  });

  it("filters by role and by hero name", async () => {
    render(
      <MemoryRouter>
        <PerksPage />
      </MemoryRouter>,
    );
    await screen.findByText("Sharp Eye");

    fireEvent.click(screen.getByRole("button", { name: "Tank" }));
    expect(
      screen.getByText("No heroes match the filters."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    fireEvent.change(screen.getByPlaceholderText("Search by name"), {
      target: { value: "zzz" },
    });
    expect(
      screen.getByText("No heroes match the filters."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search by name"), {
      target: { value: "an" },
    });
    expect(screen.getByText("Sharp Eye")).toBeInTheDocument();
  });

  it("shows only favorite heroes when asked", async () => {
    render(
      <MemoryRouter>
        <PerksPage />
      </MemoryRouter>,
    );
    await screen.findByText("Sharp Eye");

    fireEvent.click(screen.getByRole("button", { name: /only favorites/i }));

    expect(screen.getByText("Reaper")).toBeInTheDocument();
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
  });

  it("shows perk descriptions in a tooltip and has no detailed view", async () => {
    render(
      <MemoryRouter>
        <PerksPage />
      </MemoryRouter>,
    );
    await screen.findByText("Sharp Eye");
    expect(screen.queryByText("Better aim")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Detailed" })).toBeNull();

    fireEvent.mouseEnter(
      screen.getByText("Sharp Eye").closest(".perk-tile__trigger") as Element,
    );

    expect(screen.getByRole("tooltip")).toHaveTextContent("Better aim");
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Take it on ranged maps",
    );
  });

  it("reads the filters from the address", async () => {
    renderAt("/perks?role=SUPPORT&q=an");

    expect(await screen.findByText("Sharp Eye")).toBeInTheDocument();
    expect(screen.queryByText("Reaper")).not.toBeInTheDocument();
  });

  it("shows the heroes in steps and keeps the revealed rows in the history entry", async () => {
    manyHeroes();
    renderAt("/perks");
    await screen.findAllByRole("article");

    expect(screen.getAllByRole("article")).toHaveLength(12);
    fireEvent.click(
      screen.getByRole("button", { name: /Show more heroes \(20 left\)/ }),
    );

    expect(screen.getAllByRole("article")).toHaveLength(24);
    expect(screen.getByTestId("location")).toHaveTextContent('{"rows":24}');
  });

  it("restores the revealed rows when coming back to the page", async () => {
    manyHeroes();
    renderAt({ pathname: "/perks", state: { rows: 24 } });
    await screen.findAllByRole("article");

    expect(screen.getAllByRole("article")).toHaveLength(24);
  });
});
