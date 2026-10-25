import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../api/heroesApi", () => ({
  fetchHero: vi.fn(() =>
    Promise.resolve({
      slug: "ana",
      name: "Ana",
      role: "SUPPORT",
      subrole: null,
      description: null,
      portraitUrl: null,
    }),
  ),
  fetchPerks: vi.fn(() => Promise.resolve([])),
  fetchCounters: vi.fn(() =>
    Promise.resolve({
      counters: [
        {
          slug: "genji",
          name: "Genji",
          role: "DAMAGE",
          strength: 3,
          note: "Nade",
        },
      ],
      counteredBy: [],
    }),
  ),
  fetchSynergies: vi.fn(() => Promise.resolve([])),
}));

import { HeroCountersPage } from "./HeroCountersPage";
import { HeroPerksPage } from "./HeroPerksPage";

describe("hero subpages", () => {
  it("lists counters with notes and a link back to the hero", async () => {
    renderWithRouter(
      <Routes>
        <Route path="/heroes/:slug/counters" element={<HeroCountersPage />} />
      </Routes>,
      "/heroes/ana/counters",
    );

    expect(await screen.findByText("Strong against")).toBeInTheDocument();
    expect(screen.getByText("Nade")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Ana" })).toHaveAttribute(
      "href",
      "/heroes/ana",
    );
  });

  it("shows an empty state for a hero without perks", async () => {
    renderWithRouter(
      <Routes>
        <Route path="/heroes/:slug/perks" element={<HeroPerksPage />} />
      </Routes>,
      "/heroes/ana/perks",
    );

    expect(
      await screen.findByText("No perks have been added for Ana yet."),
    ).toBeInTheDocument();
  });
});
