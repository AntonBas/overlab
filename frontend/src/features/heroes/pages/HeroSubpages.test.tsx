import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../../../test/render";

import { HeroCountersRedirect } from "./HeroCountersRedirect";
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

  it("sends the old hero counters address to the hero page", async () => {
    renderWithRouter(
      <Routes>
        <Route
          path="/heroes/:slug/counters"
          element={<HeroCountersRedirect />}
        />
        <Route path="/heroes/:slug" element={<p>Hero page</p>} />
      </Routes>,
      "/heroes/ana/counters",
    );

    expect(await screen.findByText("Hero page")).toBeInTheDocument();
  });
});
