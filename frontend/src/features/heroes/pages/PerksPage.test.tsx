import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { PerksPage } from "./PerksPage";

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

vi.mock("../api/heroesApi", () => ({
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
  ],
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
  ],
}));

describe("PerksPage", () => {
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

  it("shows perk descriptions and notes in the detailed view", async () => {
    render(
      <MemoryRouter>
        <PerksPage />
      </MemoryRouter>,
    );
    await screen.findByText("Sharp Eye");
    expect(screen.queryByText("Better aim")).not.toBeInTheDocument();

    fireEvent.mouseEnter(
      screen.getByText("Sharp Eye").closest(".perk-tile__trigger") as Element,
    );
    expect(screen.getByRole("tooltip")).toHaveTextContent("Better aim");

    fireEvent.click(screen.getByRole("button", { name: "Detailed" }));

    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(screen.getByText("Better aim")).toBeInTheDocument();
    expect(screen.getByText("Take it on ranged maps")).toBeInTheDocument();
  });
});
