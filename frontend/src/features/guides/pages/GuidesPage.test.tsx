import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { guide } from "../../../test/fixtures/guides";
import { renderWithRouter } from "../../../test/render";

vi.mock("../api/guidesApi", () => ({
  fetchGuides: vi.fn(),
}));
vi.mock("../../../hooks/useCatalog", () => ({
  useHeroPortraits: () => ({}),
  useMapVisuals: () => ({
    busan: { imageUrl: null, mode: "CONTROL" },
    numbani: { imageUrl: null, mode: "HYBRID" },
  }),
}));
vi.mock("../../heroes", () => ({
  fetchHeroes: vi.fn(() =>
    Promise.resolve([
      { slug: "ana", name: "Ana", role: "SUPPORT", portraitUrl: null },
      { slug: "ashe", name: "Ashe", role: "DAMAGE", portraitUrl: null },
      { slug: "zarya", name: "Zarya", role: "TANK", portraitUrl: null },
    ]),
  ),
}));

import { fetchGuides } from "../api/guidesApi";
import { GuidesPage } from "./GuidesPage";

describe("GuidesPage", () => {
  beforeEach(() => {
    vi.mocked(fetchGuides).mockReset();
  });

  it("links to the guides of every hero and map with their counts", async () => {
    vi.mocked(fetchGuides).mockResolvedValue([
      guide({
        id: 1,
        heroSlug: "ana",
        heroName: "Ana",
        mapSlug: "busan",
        mapName: "Busan",
      }),
      guide({
        id: 2,
        heroSlug: "ana",
        heroName: "Ana",
        mapSlug: "numbani",
        mapName: "Numbani",
      }),
      guide({
        id: 3,
        heroSlug: "ashe",
        heroName: "Ashe",
        mapSlug: "busan",
        mapName: "Busan",
      }),
    ]);
    renderWithRouter(<GuidesPage />);

    const byHero = await screen.findByRole("region", {
      name: "Guides by hero",
    });
    expect(
      await within(byHero).findByRole("link", { name: /Ana/ }),
    ).toHaveAttribute("href", "/heroes/ana/guides");
    expect(within(byHero).getByText("2 guides")).toBeInTheDocument();
    expect(within(byHero).getByText("1 guide")).toBeInTheDocument();
    expect(
      within(byHero).getByRole("heading", { name: /Support/ }),
    ).toBeInTheDocument();
    expect(
      within(byHero).getByRole("heading", { name: /Damage/ }),
    ).toBeInTheDocument();
    expect(
      within(byHero).queryByRole("heading", { name: /Tank/ }),
    ).not.toBeInTheDocument();

    const byMap = screen.getByRole("region", { name: "Guides by map" });
    expect(within(byMap).getByRole("link", { name: /Busan/ })).toHaveAttribute(
      "href",
      "/maps/busan/guides",
    );
    expect(
      within(byMap).getByRole("heading", { name: /Control/ }),
    ).toBeInTheDocument();
    expect(
      within(byMap).getByRole("heading", { name: /Hybrid/ }),
    ).toBeInTheDocument();
  });

  it("links a hero or map with a single guide straight to that video", async () => {
    vi.mocked(fetchGuides).mockResolvedValue([
      guide({
        id: 3,
        path: "ashe-dynamite",
        heroSlug: "ashe",
        heroName: "Ashe",
        mapSlug: "busan",
        mapName: "Busan",
      }),
    ]);
    renderWithRouter(<GuidesPage />);

    const byHero = await screen.findByRole("region", {
      name: "Guides by hero",
    });
    expect(
      await within(byHero).findByRole("link", { name: /Ashe/ }),
    ).toHaveAttribute("href", "/guides/ashe-dynamite");
    const byMap = screen.getByRole("region", { name: "Guides by map" });
    expect(within(byMap).getByRole("link", { name: /Busan/ })).toHaveAttribute(
      "href",
      "/guides/ashe-dynamite",
    );
  });

  it("asks search engines to skip the page while there are no guides", async () => {
    vi.mocked(fetchGuides).mockResolvedValue([]);
    renderWithRouter(<GuidesPage />);

    await screen.findByText("No guides yet.");

    await waitFor(() =>
      expect(
        document.head.querySelector('meta[name="robots"]'),
      ).toHaveAttribute("content", "noindex, nofollow"),
    );
  });

  it("says so when there are no guides yet", async () => {
    vi.mocked(fetchGuides).mockResolvedValue([]);
    renderWithRouter(<GuidesPage />);

    expect(await screen.findByText("No guides yet.")).toBeInTheDocument();
  });
});
