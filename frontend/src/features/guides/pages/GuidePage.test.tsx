import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { guide as fixtureGuide } from "../../../test/fixtures/guides";
import { renderWithRouter } from "../../../test/render";

vi.mock("../api/guidesApi", () => ({
  fetchGuide: vi.fn(),
  fetchGuides: vi.fn(() => Promise.resolve([])),
}));
vi.mock("../../../hooks/useCatalog", () => ({
  useHeroPortraits: () => ({}),
  useMapVisuals: () => ({}),
}));
vi.mock("../components/GuideEmbed", () => ({
  GuideEmbed: () => <div>video embed</div>,
}));

import { fetchGuide } from "../api/guidesApi";
import { GuidePage } from "./GuidePage";

const guide = fixtureGuide({
  path: "ana-nade-spot",
  title: "Ana nade spot",
  mapSlug: "numbani",
  mapName: "Numbani",
  description: "Throw it from the balcony",
  youtubeId: "abc",
  embedUrl: "https://www.youtube.com/embed/abc",
});

function renderGuide() {
  return renderWithRouter(
    <Routes>
      <Route path="/guides/:path" element={<GuidePage />} />
    </Routes>,
    "/guides/ana-nade-spot",
  );
}

function serverFailure() {
  return Object.assign(new Error("down"), {
    isAxiosError: true,
    response: { status: 500, data: { message: "down" } },
  });
}

describe("GuidePage", () => {
  beforeEach(() => {
    vi.mocked(fetchGuide).mockReset();
  });

  it("shows the guide with hero, map, video and description", async () => {
    vi.mocked(fetchGuide).mockResolvedValue(guide);

    renderGuide();

    expect(
      await screen.findByRole("heading", { name: "Ana nade spot" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Numbani")).toBeInTheDocument();
    expect(screen.getByText("video embed")).toBeInTheDocument();
    expect(screen.getByText("Throw it from the balcony")).toBeInTheDocument();
    expect(fetchGuide).toHaveBeenCalledWith("ana-nade-spot");
  });

  it("moves an old id-prefixed address to the slug address", async () => {
    vi.mocked(fetchGuide).mockResolvedValue(guide);

    renderWithRouter(
      <Routes>
        <Route path="/guides/:path" element={<GuidePage />} />
      </Routes>,
      "/guides/15-ana-nade-spot",
    );

    expect(
      await screen.findByRole("heading", { name: "Ana nade spot" }),
    ).toBeInTheDocument();
    expect(fetchGuide).toHaveBeenCalledWith("15-ana-nade-spot");
  });

  it("omits the map and description when the guide has none", async () => {
    vi.mocked(fetchGuide).mockResolvedValue({
      ...guide,
      mapSlug: null,
      mapName: null,
      description: "",
    });

    renderGuide();

    await screen.findByRole("heading", { name: "Ana nade spot" });
    expect(screen.queryByText("Numbani")).not.toBeInTheDocument();
    expect(screen.queryByText("on")).not.toBeInTheDocument();
  });

  it("keeps an unknown guide out of the search index", async () => {
    vi.mocked(fetchGuide).mockRejectedValue(
      Object.assign(new Error("missing"), {
        isAxiosError: true,
        response: { status: 404, data: { message: "missing" } },
      }),
    );

    renderGuide();

    await screen.findByRole("alert");
    expect(
      document.head
        .querySelector('meta[name="robots"]')
        ?.getAttribute("content"),
    ).toBe("noindex, nofollow");
  });

  it("shows an error with retry when the guide cannot be loaded", async () => {
    vi.mocked(fetchGuide).mockRejectedValue(serverFailure());

    renderGuide();

    expect(
      await screen.findByRole("button", { name: /retry|try again/i }),
    ).toBeInTheDocument();
  });
});
