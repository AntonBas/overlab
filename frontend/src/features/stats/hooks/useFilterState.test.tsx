import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";
import type { Preferences } from "../../../types/user";

let preferences: Preferences | null = null;
vi.mock("../../personal/context/usePersonalData", () => ({
  usePersonalData: () => ({ preferences }),
}));

import { useFilterState } from "./useFilterState";

function Probe() {
  const { filters } = useFilterState();
  return (
    <p>
      {filters.queue} {filters.tier} {filters.region}
    </p>
  );
}

describe("useFilterState saved defaults", () => {
  it("applies saved defaults when the address has no filters", async () => {
    preferences = {
      queue: "COMPETITIVE",
      tier: "GOLD",
      region: "AMERICAS",
      platform: null,
    };
    renderWithRouter(<Probe />, "/stats");

    await waitFor(() =>
      expect(screen.getByText("COMPETITIVE ALL AMERICAS")).toBeInTheDocument(),
    );
  });

  it("keeps the filters from the address over saved defaults", async () => {
    preferences = {
      queue: "COMPETITIVE",
      tier: "GOLD",
      region: "AMERICAS",
      platform: null,
    };
    renderWithRouter(<Probe />, "/stats?tier=master");

    expect(screen.getByText("COMPETITIVE MASTER EUROPE")).toBeInTheDocument();
  });

  it("forces all ranks for the saved Quick Play default", async () => {
    preferences = {
      queue: "QUICK_PLAY",
      tier: "GOLD",
      region: null,
      platform: null,
    };
    renderWithRouter(<Probe />, "/stats");

    await waitFor(() =>
      expect(screen.getByText("QUICK_PLAY ALL EUROPE")).toBeInTheDocument(),
    );
  });
});
