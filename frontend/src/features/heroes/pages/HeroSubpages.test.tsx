import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../../../test/render";

import { HeroOnMapRedirect } from "./HeroOnMapRedirect";

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
});
