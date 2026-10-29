import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../../stats/api/statsApi", () => ({
  fetchHeroHistory: vi.fn(() => Promise.resolve({ hero: {}, points: [] })),
}));
vi.mock("../../patches/api/patchesApi", () => ({
  fetchPatches: vi.fn(() => Promise.resolve([])),
}));

import { fetchHeroHistory } from "../../stats/api/statsApi";
import { HeroHistorySection } from "./HeroHistorySection";

describe("HeroHistorySection", () => {
  beforeEach(() => {
    vi.mocked(fetchHeroHistory).mockClear();
  });

  it("asks for the history of the hero on one map when a map is given", async () => {
    renderWithRouter(
      <HeroHistorySection slug="ana" mapSlug="busan" queue="COMPETITIVE" />,
    );

    await waitFor(() =>
      expect(fetchHeroHistory).toHaveBeenCalledWith(
        "ana",
        expect.objectContaining({ map: "busan", queue: "COMPETITIVE" }),
      ),
    );
    expect(await screen.findByText(/Not enough data/)).toBeInTheDocument();
  });

  it("asks for all maps without a map", async () => {
    renderWithRouter(<HeroHistorySection slug="ana" queue="COMPETITIVE" />);

    await waitFor(() =>
      expect(fetchHeroHistory).toHaveBeenCalledWith(
        "ana",
        expect.objectContaining({ map: undefined }),
      ),
    );
  });
});
