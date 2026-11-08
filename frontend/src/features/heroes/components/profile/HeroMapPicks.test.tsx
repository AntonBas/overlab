import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../../test/render";
import type { HeroMapStat } from "../../../../types/api";

vi.mock("../../../maps/api/mapsApi", () => ({
  fetchMaps: vi.fn(() =>
    Promise.resolve([
      {
        slug: "busan",
        name: "Busan",
        mode: "CONTROL",
        imageUrl: "/media/maps/busan-1.webp",
      },
      { slug: "rialto", name: "Rialto", mode: "ESCORT", imageUrl: null },
    ]),
  ),
}));

import { HeroMapPicks } from "./HeroMapPicks";

function entry(overrides: Partial<HeroMapStat>): HeroMapStat {
  return {
    mapSlug: "busan",
    mapName: "Busan",
    mode: "CONTROL",
    winRate: 50,
    pickRate: 20,
    banRate: null,
    winRateDelta: 0,
    pickRateDelta: null,
    capturedAt: "2026-10-29T10:00:00Z",
    ...overrides,
  };
}

const maps = [
  entry({ mapSlug: "busan", mapName: "Busan", winRate: 55, winRateDelta: 3 }),
  entry({
    mapSlug: "rialto",
    mapName: "Rialto",
    winRate: 44,
    winRateDelta: -4,
  }),
];

describe("HeroMapPicks", () => {
  it("shows the best maps first with links that select the map on the hero page", async () => {
    renderWithRouter(<HeroMapPicks heroName="Ana" maps={maps} linkSuffix="" />);

    const gain = await screen.findByRole("region", { name: "by gain" });

    expect(
      screen.getByRole("heading", { name: "Best maps for Ana" }),
    ).toBeInTheDocument();
    expect(within(gain).getByRole("link", { name: /Busan/ })).toHaveAttribute(
      "href",
      "/maps/busan",
    );
    expect(within(gain).queryByText("Rialto")).toBeNull();
  });

  it("switches to the worst maps", async () => {
    renderWithRouter(<HeroMapPicks heroName="Ana" maps={maps} linkSuffix="" />);
    await screen.findByRole("region", { name: "by gain" });

    await userEvent.click(screen.getByRole("button", { name: "Worst maps" }));

    const drop = screen.getByRole("region", { name: "by gain" });
    expect(
      screen.getByRole("heading", { name: "Worst maps for Ana" }),
    ).toBeInTheDocument();
    expect(
      within(drop).getByText("Weakest compared with the hero's average"),
    ).toBeInTheDocument();
    expect(within(drop).getByText("Rialto")).toBeInTheDocument();
  });

  it("lists the weakest maps even when the hero is above average everywhere", async () => {
    const allAbove = [
      entry({
        mapSlug: "busan",
        mapName: "Busan",
        winRate: 60,
        winRateDelta: 5,
      }),
      entry({
        mapSlug: "rialto",
        mapName: "Rialto",
        winRate: 58,
        winRateDelta: 2,
      }),
    ];
    renderWithRouter(
      <HeroMapPicks heroName="Ana" maps={allAbove} linkSuffix="" />,
    );
    await screen.findByRole("region", { name: "by gain" });

    await userEvent.click(screen.getByRole("button", { name: "Worst maps" }));

    expect(
      within(screen.getByRole("region", { name: "by gain" })).getByText(
        "Rialto",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the quick play query in the links", async () => {
    renderWithRouter(
      <HeroMapPicks
        heroName="Ana"
        maps={maps}
        linkSuffix="?queue=quick_play"
      />,
    );

    const gain = await screen.findByRole("region", { name: "by gain" });

    expect(within(gain).getByRole("link", { name: /Busan/ })).toHaveAttribute(
      "href",
      "/maps/busan?queue=quick_play",
    );
  });

  it("shows the placeholder image for a map without a picture", async () => {
    const { container } = renderWithRouter(
      <HeroMapPicks
        heroName="Ana"
        maps={[maps[1], entry({ mapSlug: "rialto", winRateDelta: -4 })].slice(
          0,
          1,
        )}
        linkSuffix=""
      />,
    );
    await screen.findByRole("region", { name: "by gain" });

    expect(
      container.querySelector('img[src="/images/map-placeholder.svg"]'),
    ).not.toBeNull();
  });

  it("expands to every map, worst first in the worst view", async () => {
    const many = ["a", "b", "c", "d", "e", "f", "g", "h"].map((slug, index) =>
      entry({
        mapSlug: slug,
        mapName: `Map ${slug}`,
        winRateDelta: 4 - index,
      }),
    );
    renderWithRouter(<HeroMapPicks heroName="Ana" maps={many} linkSuffix="" />);
    const list = await screen.findByRole("region", { name: "by gain" });
    expect(within(list).getAllByRole("link")).toHaveLength(4);

    await userEvent.click(screen.getByRole("button", { name: "Worst maps" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Show all 8 maps" }),
    );

    const names = within(screen.getByRole("region", { name: "by gain" }))
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(names).toHaveLength(8);
    expect(names[0]).toContain("Map h");
    expect(names[7]).toContain("Map a");
  });
});
