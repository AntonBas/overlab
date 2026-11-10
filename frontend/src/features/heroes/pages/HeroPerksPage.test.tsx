import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";
import { fetchPerks } from "../api/heroesApi";
import { HeroPerksPage } from "./HeroPerksPage";

vi.mock("../api/heroesApi", () => ({
  fetchHero: async () => ({
    slug: "ana",
    name: "Ana",
    role: "SUPPORT",
    subrole: null,
    description: null,
    strengths: null,
    weaknesses: null,
    portraitUrl: null,
  }),
  fetchPerks: vi.fn(),
}));

function renderPage() {
  return renderWithRouter(
    <Routes>
      <Route path="/heroes/:slug/perks" element={<HeroPerksPage />} />
    </Routes>,
    "/heroes/ana/perks",
  );
}

describe("HeroPerksPage", () => {
  it("shows the perks with a keyword heading, title and links to the other hero pages", async () => {
    vi.mocked(fetchPerks).mockResolvedValue([
      {
        id: 1,
        heroSlug: "ana",
        name: "Sharp Eye",
        description: "Better aim",
        slot: "MINOR",
        position: "LEFT",
        recommendation: "RECOMMENDED",
        recommendationNote: null,
        iconUrl: null,
      },
    ]);

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Ana perks" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sharp Eye")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Best maps for Ana" }),
    ).toHaveAttribute("href", "/heroes/ana/maps");
    await waitFor(() =>
      expect(document.title).toBe(
        "Ana perks: recommended Minor and Major perks | Overlab",
      ),
    );
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  it("hides a page without perks from search engines", async () => {
    vi.mocked(fetchPerks).mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText("No perks have been added for Ana yet."),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        document.head
          .querySelector('meta[name="robots"]')
          ?.getAttribute("content"),
      ).toBe("noindex, nofollow"),
    );
  });
});
