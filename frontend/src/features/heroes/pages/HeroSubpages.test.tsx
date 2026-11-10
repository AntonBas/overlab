import { screen } from "@testing-library/react";
import { Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../../../test/render";

import { HeroOnMapRedirect } from "./HeroOnMapRedirect";
import { HeroSectionRedirect } from "./HeroSectionRedirect";

function HeroPageWithHash() {
  const location = useLocation();
  return <p>Hero page {location.hash}</p>;
}

describe("hero subpages", () => {
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

  it("sends the old hero section addresses to the matching section of the hero page", async () => {
    renderWithRouter(
      <Routes>
        <Route
          path="/heroes/:slug/perks"
          element={<HeroSectionRedirect section="perks" />}
        />
        <Route path="/heroes/:slug" element={<HeroPageWithHash />} />
      </Routes>,
      "/heroes/ana/perks",
    );

    expect(await screen.findByText("Hero page #perks")).toBeInTheDocument();
  });
});
