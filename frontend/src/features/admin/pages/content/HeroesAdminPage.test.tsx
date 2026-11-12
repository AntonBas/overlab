import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../../test/render";

vi.mock("../../api/adminApi", () => ({
  fetchAdminHeroes: vi.fn(() =>
    Promise.resolve([
      {
        slug: "ana",
        name: "Ana",
        role: "SUPPORT",
        subrole: "tactician",
        description: null,
        portraitUrl: "/media/heroes/ana.png",
        active: true,
      },
      {
        slug: "mei",
        name: "Mei",
        role: "DAMAGE",
        subrole: null,
        description: null,
        portraitUrl: null,
        active: true,
      },
    ]),
  ),
  updateHero: vi.fn(),
}));

import { HeroesAdminPage } from "./HeroesAdminPage";

describe("HeroesAdminPage", () => {
  it("shows the portrait next to the name, or the first letter without one", async () => {
    const { container } = renderWithRouter(<HeroesAdminPage />);

    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(
      container.querySelector('img[src="/media/heroes/ana.png"]'),
    ).not.toBeNull();
    expect(screen.getByText("M")).toBeInTheDocument();
  });
});
