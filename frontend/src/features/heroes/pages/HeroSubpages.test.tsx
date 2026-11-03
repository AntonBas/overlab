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
import { HeroOnMapRedirect } from "./HeroOnMapRedirect";
import { HeroPerksRedirect } from "./HeroPerksRedirect";

describe("hero subpages", () => {
  it("sends the old hero perks address to the perks page", async () => {
    renderWithRouter(
      <Routes>
        <Route path="/heroes/:slug/perks" element={<HeroPerksRedirect />} />
        <Route path="/perks" element={<p>Perks overview</p>} />
      </Routes>,
      "/heroes/ana/perks",
    );

    expect(await screen.findByText("Perks overview")).toBeInTheDocument();
  });

  it("sends the old hero on map address to the hero page with the map selected", async () => {
    renderWithRouter(
      <Routes>
        <Route path="/maps/:map/:hero" element={<HeroOnMapRedirect />} />
        <Route path="/heroes/:slug" element={<p>Hero page</p>} />
      </Routes>,
      "/maps/busan/ana?queue=quick_play",
    );

    expect(await screen.findByText("Hero page")).toBeInTheDocument();
  });

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
});
