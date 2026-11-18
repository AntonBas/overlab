import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";
import type { Preferences } from "../../../types/user";

let preferences: Preferences | null = null;
vi.mock("../../personal/context/usePersonalData", () => ({
  usePersonalData: () => ({ preferences }),
}));

import { RegionProvider } from "../context/RegionProvider";
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

function RegionProbe() {
  const { filters, update, key } = useFilterState();
  return (
    <>
      <p data-testid="key">{key}</p>
      <p>{filters.region}</p>
      <button type="button" onClick={() => update({ region: "ASIA" })}>
        Choose Asia
      </button>
    </>
  );
}

describe("useFilterState region", () => {
  it("changes the fetch key when the chosen region becomes the saved default", async () => {
    preferences = null;
    renderWithRouter(
      <RegionProvider>
        <RegionProbe />
      </RegionProvider>,
      "/stats",
    );
    const before = screen.getByTestId("key").textContent;

    await userEvent.click(screen.getByRole("button", { name: "Choose Asia" }));

    await waitFor(() =>
      expect(screen.getByTestId("key").textContent).not.toBe(before),
    );
    expect(screen.getByText("ASIA")).toBeInTheDocument();
  });
});
