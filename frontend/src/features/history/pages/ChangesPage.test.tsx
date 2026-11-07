import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

async function openList(name: string): Promise<HTMLElement> {
  await userEvent.click(await screen.findByRole("combobox", { name }));
  return screen.findByRole("listbox", { name });
}

function labelsIn(list: HTMLElement): string[] {
  return within(list)
    .getAllByRole("option")
    .map((option) => option.textContent ?? "");
}

describe("ChangesPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-07T12:00:00Z"));
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lists only patches that were released after statistics collection started", async () => {
    renderPage();

    const list = await openList("Period");
    await within(list).findByRole("option", { name: /Taking Reign/ });
    expect(labelsIn(list)).toEqual([
      "Last 7 days",
      "Taking Reign · 3 Nov 2026",
    ]);
  });

  it("offers the 30 day period once the history is long enough", async () => {
    vi.mocked(fetchHistoryStart).mockResolvedValue({
      firstCapturedAt: "2026-09-20T17:00:00Z",
    });
    renderPage();

    const list = await openList("Period");
    await within(list).findByRole("option", { name: /Taking Reign/ });
    expect(labelsIn(list).slice(0, 2)).toEqual(["Last 7 days", "Last 30 days"]);
  });

  it("offers a rank filter in Competitive and requests the chosen rank", async () => {
    renderPage("/changes?tier=gold");

    expect(
      await screen.findByRole("combobox", { name: "Rank" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchComparison).toHaveBeenLastCalledWith(
        expect.objectContaining({ queue: "COMPETITIVE", tier: "GOLD" }),
      ),
    );
  });

  it("ignores the rank in Quick Play", async () => {
    renderPage("/changes?queue=quick_play&tier=gold");

    await waitFor(() =>
      expect(fetchComparison).toHaveBeenLastCalledWith(
        expect.objectContaining({ queue: "QUICK_PLAY", tier: "ALL" }),
      ),
    );
    expect(screen.queryByRole("combobox", { name: "Rank" })).toBeNull();
  });

  it("shows the current and previous season patches and keeps older seasons behind the season filter", async () => {
    vi.mocked(fetchPatches).mockResolvedValue([
      patch(3, "2026-12-10", "Season 6 launch", "2026-12-10T00:00:00Z", 6),
      NEW_PATCH,
      patch(5, "2026-10-30", "Season 4 late", "2026-10-30T00:00:00Z", 4),
      patch(4, "2026-11-01", "Unknown", "2026-11-01T00:00:00Z", null),
    ]);
    renderPage();

    const seasons = await openList("Season");
    expect(labelsIn(seasons)).toEqual([
      "Current and previous",
      "Season 4",
      "Other patches",
    ]);
    const periods = await openList("Period");
    await within(periods).findByRole("option", { name: /Season 6 launch/ });
    expect(labelsIn(periods)).toEqual([
      "Last 7 days",
      "Season 6 launch · 10 Dec 2026",
      "Taking Reign · 3 Nov 2026",
    ]);
  });

  it("opens the season of an older patch that was opened from a link", async () => {
    vi.mocked(fetchPatches).mockResolvedValue([
      patch(3, "2026-12-10", "Season 6 launch", "2026-12-10T00:00:00Z", 6),
      NEW_PATCH,
      patch(5, "2026-10-30", "Season 4 late", "2026-10-30T00:00:00Z", 4),
    ]);
    renderPage("/changes?view=patch%3A2026-10-30");

    expect(
      await screen.findByRole("combobox", { name: "Season" }),
    ).toHaveTextContent("Season 4");
    const periods = await openList("Period");
    await within(periods).findByRole("option", { name: /Season 4 late/ });
    expect(
      within(periods).queryByRole("option", { name: /Season 6 launch/ }),
    ).toBeNull();
  });

  it("offers longer periods once the history is long enough", async () => {
    vi.mocked(fetchHistoryStart).mockResolvedValue({
      firstCapturedAt: "2025-10-01T00:00:00Z",
    });
    renderPage();

    const list = await openList("Period");
    await within(list).findByRole("option", { name: /Taking Reign/ });
    expect(labelsIn(list).slice(0, 5)).toEqual([
      "Last 7 days",
      "Last 30 days",
      "Last 3 months",
      "Last 6 months",
      "Last year",
    ]);
  });

  it("lists every patch while the start of the history is unknown", async () => {
    vi.mocked(fetchHistoryStart).mockResolvedValue({ firstCapturedAt: null });
    renderPage();

    const list = await openList("Period");
    expect(
      await within(list).findByRole("option", {
        name: /Season 5 · 6 Oct 2026/,
      }),
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
    const list = await openList("Period");
    expect(labelsIn(list)).toContain("Season 5 · 6 Oct 2026");
  });

  it("uses the same filters as the statistics page", async () => {
    renderPage("/changes?platform=console&region=asia");

    await screen.findByRole("combobox", { name: "Period" });
    const filters = screen.getByRole("form", { name: "Statistics filters" });
    expect(
      screen.getByRole("group", { name: "Game mode" }),
    ).toBeInTheDocument();
    expect(
      within(filters).queryByRole("group", { name: "Game mode" }),
    ).toBeNull();
    expect(
      within(filters).getByRole("combobox", { name: "Platform" }),
    ).toBeInTheDocument();
    expect(
      within(filters).getByRole("combobox", { name: "Region" }),
    ).toBeInTheDocument();
    expect(
      within(filters).getByRole("group", { name: "Role" }),
    ).toBeInTheDocument();
    expect(within(filters).queryByRole("combobox", { name: "Map" })).toBeNull();
    expect(within(filters).getByRole("searchbox")).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchComparison).toHaveBeenLastCalledWith(
        expect.objectContaining({ platform: "CONSOLE", region: "ASIA" }),
      ),
    );
  });

  it("describes the compared dates under the title", async () => {
    renderPage();

    const heading = await screen.findByRole("heading", {
      name: "What changed",
    });
    expect(heading.parentElement).toHaveTextContent(
      "Changes from 2 Nov 2026 to 6 Nov 2026.",
    );
  });

  it("explains that nothing has changed when only one snapshot exists", async () => {
    vi.mocked(fetchComparison).mockResolvedValue({
      beforeCapturedAt: "2026-10-29T16:15:00Z",
      afterCapturedAt: "2026-10-29T16:15:00Z",
      queue: "COMPETITIVE",
      tier: "ALL",
      map: "all-maps",
      platform: "PC",
      region: "ASIA",
      heroes: [
        {
          heroSlug: "ana",
          heroName: "Ana",
          role: "SUPPORT",
          winRateBefore: 50,
          winRateAfter: 50,
          winRateChange: 0,
          pickRateBefore: 10,
          pickRateAfter: 10,
          pickRateChange: 0,
          banRateBefore: 5,
          banRateAfter: 5,
          banRateChange: 0,
        },
      ],
    });
    renderPage("/changes?region=asia");

    expect(
      await screen.findByText(/Only one snapshot is available so far/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("says when a platform and region have not been collected yet", async () => {
    vi.mocked(fetchHistoryStart).mockResolvedValue({ firstCapturedAt: null });
    vi.mocked(fetchComparison).mockRejectedValue(
      Object.assign(new Error("missing"), {
        isAxiosError: true,
        response: { status: 404, data: { message: "No snapshot" } },
      }),
    );
    renderPage("/changes?platform=console");

    expect(
      await screen.findByText(
        "Statistics for this platform and region have not been collected yet.",
      ),
    ).toBeInTheDocument();
  });

  it("filters the changes by hero name", async () => {
    const hero = (slug: string, name: string) => ({
      heroSlug: slug,
      heroName: name,
      role: "SUPPORT" as const,
      winRateBefore: 50,
      winRateAfter: 51,
      winRateChange: 1,
      pickRateBefore: 10,
      pickRateAfter: 11,
      pickRateChange: 1,
      banRateBefore: 5,
      banRateAfter: 5,
      banRateChange: 0,
    });
    vi.mocked(fetchComparison).mockResolvedValue({
      beforeCapturedAt: "2026-11-02T10:00:00Z",
      afterCapturedAt: "2026-11-06T10:00:00Z",
      queue: "COMPETITIVE",
      tier: "ALL",
      map: "all-maps",
      platform: "PC",
      region: "EUROPE",
      heroes: [hero("ana", "Ana"), hero("mercy", "Mercy")],
    });
    renderPage();

    await screen.findByRole("link", { name: "Mercy" });
    await userEvent.type(screen.getByRole("searchbox"), "mer");

    expect(screen.queryByRole("link", { name: "Ana" })).toBeNull();
    expect(screen.getByRole("link", { name: "Mercy" })).toBeInTheDocument();
  });
});
