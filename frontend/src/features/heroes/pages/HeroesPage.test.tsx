import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hero as heroFixture } from "../../../test/fixtures/heroes";
import { renderWithRouter } from "../../../test/render";
import type { HeroRole } from "../../../types/hero";

vi.mock("../api/heroesApi", () => ({
  fetchHeroes: vi.fn(),
}));

import { fetchHeroes } from "../api/heroesApi";
import { HeroesPage } from "./HeroesPage";

function hero(
  slug: string,
  name: string,
  role: HeroRole,
  recentlyAdded = false,
) {
  return heroFixture({
    slug,
    name,
    role,
    subrole: null,
    description: null,
    recentlyAdded,
  });
}

function serverFailure() {
  return Object.assign(new Error("down"), {
    isAxiosError: true,
    response: { status: 500, data: { message: "down" } },
  });
}

describe("HeroesPage", () => {
  beforeEach(() => {
    vi.mocked(fetchHeroes).mockReset();
  });

  it("groups heroes by role and links each to its page", async () => {
    vi.mocked(fetchHeroes).mockResolvedValue([
      hero("ana", "Ana", "SUPPORT"),
      hero("reaper", "Reaper", "DAMAGE"),
    ]);

    renderWithRouter(<HeroesPage />, "/heroes");

    const ana = await screen.findByRole("link", { name: /Ana/ });
    expect(ana).toHaveAttribute("href", "/heroes/ana");
    expect(screen.getByRole("link", { name: /Reaper/ })).toHaveAttribute(
      "href",
      "/heroes/reaper",
    );
    const supportSection = ana.closest("section");
    expect(supportSection).not.toBeNull();
    expect(
      within(supportSection as HTMLElement).queryByRole("link", {
        name: /Reaper/,
      }),
    ).not.toBeInTheDocument();
  });

  it("shows an error with retry when heroes fail to load", async () => {
    vi.mocked(fetchHeroes).mockRejectedValue(serverFailure());

    renderWithRouter(<HeroesPage />, "/heroes");

    expect(
      await screen.findByRole("button", { name: /retry|try again/i }),
    ).toBeInTheDocument();
  });
});
