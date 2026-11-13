import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HeroOnMapRedirect } from "./HeroOnMapRedirect";
import { HeroSectionRedirect } from "./HeroSectionRedirect";

function CurrentLocation() {
  const location = useLocation();
  return (
    <p data-testid="location">
      {location.pathname}
      {location.search}
      {location.hash}
    </p>
  );
}

function renderAt(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/maps/:map/:hero" element={<HeroOnMapRedirect />} />
        <Route
          path="/heroes/:slug/perks"
          element={<HeroSectionRedirect section="perks" />}
        />
        <Route path="/heroes/:slug" element={<CurrentLocation />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("HeroOnMapRedirect", () => {
  it("sends the old map hero url to the hero page", () => {
    renderAt("/maps/busan/ana");

    expect(screen.getByTestId("location")).toHaveTextContent("/heroes/ana");
  });

  it("keeps the quick play queue", () => {
    renderAt("/maps/busan/ana?queue=quick_play");

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/heroes/ana?queue=quick_play",
    );
  });

  it("drops unknown query parameters", () => {
    renderAt("/maps/busan/ana?queue=other&x=1");

    expect(screen.getByTestId("location").textContent).toBe("/heroes/ana");
  });
});

describe("HeroSectionRedirect", () => {
  it("sends the section url to the hero page anchor", () => {
    renderAt("/heroes/ana/perks");

    expect(screen.getByTestId("location").textContent).toBe(
      "/heroes/ana#perks",
    );
  });
});
