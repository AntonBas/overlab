import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../api/guidesApi", () => ({
  fetchGuide: vi.fn(),
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

const guide = {
  path: "ana-nade-spot",
  title: "Ana nade spot",
  heroSlug: "ana",
  heroName: "Ana",
  mapSlug: "numbani",
  mapName: "Numbani",
  description: "Throw it from the balcony",
  youtubeId: "abc",
  embedUrl: "https://www.youtube.com/embed/abc",
  createdAt: "2026-01-01T00:00:00Z",
};

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
    vi.mocked(fetchGuide).mockResolvedValue(guide as never);

    renderGuide();

    expect(
      await screen.findByRole("heading", { name: "Ana nade spot" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Numbani")).toBeInTheDocument();
    expect(screen.getByText("video embed")).toBeInTheDocument();
    expect(screen.getByText("Throw it from the balcony")).toBeInTheDocument();
    expect(fetchGuide).toHaveBeenCalledWith("ana-nade-spot");
  });

  it("omits the map and description when the guide has none", async () => {
    vi.mocked(fetchGuide).mockResolvedValue({
      ...guide,
      mapSlug: null,
      mapName: null,
      description: "",
    } as never);

    renderGuide();

    await screen.findByRole("heading", { name: "Ana nade spot" });
    expect(screen.queryByText("Numbani")).not.toBeInTheDocument();
    expect(screen.queryByText("on")).not.toBeInTheDocument();
  });

  it("shows an error with retry when the guide cannot be loaded", async () => {
    vi.mocked(fetchGuide).mockRejectedValue(serverFailure());

    renderGuide();

    expect(
      await screen.findByRole("button", { name: /retry|try again/i }),
    ).toBeInTheDocument();
  });
});
