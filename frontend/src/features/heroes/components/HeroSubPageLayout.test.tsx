import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../../../test/render";
import type { Hero } from "../../../types/hero";
import { HeroSubPageLayout } from "./HeroSubPageLayout";

function hero(slug: string, name: string): Hero {
  return {
    slug,
    name,
    role: "TANK",
    subrole: null,
    description: null,
    strengths: null,
    weaknesses: null,
    portraitUrl: null,
  };
}

const heroes = [hero("hazard", "Hazard"), hero("zarya", "Zarya")];

function renderLayout(props: { sectionPath?: string; linkSuffix?: string }) {
  return renderWithRouter(
    <HeroSubPageLayout
      hero={heroes[0]}
      allHeroes={heroes}
      section="Perks"
      title="Hazard perks"
      subtitle="Perks"
      {...props}
    >
      <p>content</p>
    </HeroSubPageLayout>,
  );
}

describe("HeroSubPageLayout", () => {
  it("links the other heroes to the same sub page", () => {
    renderLayout({ sectionPath: "perks" });

    expect(screen.getByRole("link", { name: "Zarya" })).toHaveAttribute(
      "href",
      "/heroes/zarya/perks",
    );
  });

  it("keeps the chosen queue in the links to the other heroes", () => {
    renderLayout({ sectionPath: "maps", linkSuffix: "?queue=quick_play" });

    expect(screen.getByRole("link", { name: "Zarya" })).toHaveAttribute(
      "href",
      "/heroes/zarya/maps?queue=quick_play",
    );
  });

  it("falls back to the hero page when the section has no page per hero", () => {
    renderLayout({});

    expect(screen.getByRole("link", { name: "Zarya" })).toHaveAttribute(
      "href",
      "/heroes/zarya",
    );
  });
});
