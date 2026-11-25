import { act, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";
vi.mock("../../personal", () => ({
  FavoriteButton: () => <button type="button">favorite</button>,
}));

import { HeroSectionNav } from "./HeroSectionNav";

const sections = [
  { id: "hero-statistics", label: "Statistics" },
  { id: "hero-maps", label: "Maps" },
];
const hero = { slug: "ana", name: "Ana", portraitUrl: null };

function pretendNavIsAt(top: number) {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    top,
    bottom: top + 40,
    left: 0,
    right: 0,
    width: 0,
    height: 40,
    x: 0,
    y: top,
    toJSON: () => ({}),
  });
}

describe("HeroSectionNav", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the hero in the bar only once the bar sticks to the top", () => {
    pretendNavIsAt(500);
    renderWithRouter(<HeroSectionNav sections={sections} hero={hero} />);
    const nav = screen.getByRole("navigation", { name: "Hero sections" });
    expect(nav).not.toHaveTextContent("Ana");

    pretendNavIsAt(0);
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(nav).toHaveTextContent("Ana");
  });

  it("lists the sections as links", () => {
    pretendNavIsAt(500);
    renderWithRouter(<HeroSectionNav sections={sections} hero={hero} />);

    expect(screen.getByRole("link", { name: "Maps" })).toBeInTheDocument();
  });
});
