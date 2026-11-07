import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";
import type { Patch } from "../../../types/api";

vi.mock("../../stats/api/statsApi", () => ({
  fetchComparison: vi.fn(),
  fetchHistoryStart: vi.fn(),
}));
vi.mock("../../patches/api/patchesApi", () => ({ fetchPatches: vi.fn() }));
vi.mock("../../heroes/api/heroesApi", () => ({
  fetchHeroes: vi.fn(() => Promise.resolve([])),
}));

import { fetchPatches } from "../../patches/api/patchesApi";
import { fetchComparison, fetchHistoryStart } from "../../stats/api/statsApi";
import { ChangesPage } from "./ChangesPage";

function patch(
  id: number,
  slug: string,
  title: string,
  releasedAt: string,
  season: number | null = 5,
): Patch {
  return { id, version: slug, slug, title, season, releasedAt, notes: null };
}

const OLD_PATCH = patch(1, "2026-10-06", "Season 5", "2026-10-06T00:00:00Z");
const NEW_PATCH = patch(
  2,
  "2026-11-03",
  "Taking Reign",
  "2026-11-03T00:00:00Z",
);

function renderPage(route = "/changes") {
  renderWithRouter(
    <Routes>
      <Route path="/changes" element={<ChangesPage />} />
    </Routes>,
    route,
  );
}

function optionLabels(): string[] {
  return screen
    .getAllByRole("option")
    .map((option) => option.textContent ?? "");
}

describe("ChangesPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fetchPatches).mockResolvedValue([NEW_PATCH, OLD_PATCH]);
    vi.mocked(fetchHistoryStart).mockResolvedValue({
      firstCapturedAt: "2026-10-28T17:00:00Z",
    });
    vi.mocked(fetchComparison).mockResolvedValue({
      beforeCapturedAt: "2026-11-02T10:00:00Z",
      afterCapturedAt: "2026-11-06T10:00:00Z",
      queue: "COMPETITIVE",
      tier: "ALL",
      map: "all-maps",
      platform: "PC",
      region: "EUROPE",
      heroes: [],
    });
  });

  it("lists only patches that were released after statistics collection started", async () => {
    renderPage();

    expect(
      await screen.findByText("Taking Reign · 3 Nov 2026"),
    ).toBeInTheDocument();
    expect(optionLabels()).toEqual([
      "Last 7 days",
      "Last 30 days",
      "Taking Reign · 3 Nov 2026",
    ]);
  });

  it("groups patches by season", async () => {
    vi.mocked(fetchPatches).mockResolvedValue([
      patch(3, "2026-12-10", "Season 6 launch", "2026-12-10T00:00:00Z", 6),
      NEW_PATCH,
      patch(4, "2026-11-01", "Unknown", "2026-11-01T00:00:00Z", null),
    ]);
    renderPage();

    await screen.findByText("Taking Reign · 3 Nov 2026");
    const groups = screen
      .getAllByRole("group")
      .map((group) => group.getAttribute("label"))
      .filter((label) => label !== null);
    expect(groups).toEqual(["Recent", "Season 6", "Season 5", "Other patches"]);
  });

  it("lists every patch while the start of the history is unknown", async () => {
    vi.mocked(fetchHistoryStart).mockResolvedValue({ firstCapturedAt: null });
    renderPage();

    expect(
      await screen.findByText("Season 5 · 6 Oct 2026"),
    ).toBeInTheDocument();
  });

  it("keeps a patch that was opened from a link and explains why it cannot be compared", async () => {
    vi.mocked(fetchComparison).mockRejectedValue(
      Object.assign(new Error("missing"), {
        isAxiosError: true,
        response: { status: 404, data: { message: "No snapshot" } },
      }),
    );
    renderPage("/changes?view=patch%3A2026-10-06");

    expect(
      await screen.findByText(/started on 28 Oct 2026, after this patch/),
    ).toBeInTheDocument();
    expect(optionLabels()).toContain("Season 5 · 6 Oct 2026");
  });
});
