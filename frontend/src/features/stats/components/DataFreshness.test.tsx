import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("../api/statsApi", () => ({ fetchFreshness: vi.fn() }));

import { fetchFreshness } from "../api/statsApi";
import { DataFreshness } from "./DataFreshness";

const fetchFreshnessMock = vi.mocked(fetchFreshness);

function renderNote() {
  return render(
    <DataFreshness
      queue="COMPETITIVE"
      tier="ALL"
      platform="PC"
      region="EUROPE"
    />,
  );
}

describe("DataFreshness", () => {
  beforeEach(() => {
    fetchFreshnessMock.mockReset();
  });

  it("explains when the numbers last changed", async () => {
    fetchFreshnessMock.mockResolvedValue({
      capturedAt: "2026-10-29T10:00:00Z",
      lastCheckedAt: "2026-10-29T10:00:00Z",
      valuesSince: "2026-10-28T17:04:00Z",
      snapshotCount: 3,
      changeObserved: false,
    });

    renderNote();

    expect(
      await screen.findByText(/since we started collecting/),
    ).toBeInTheDocument();
    expect(fetchFreshnessMock).toHaveBeenCalledWith(
      "COMPETITIVE",
      "ALL",
      "PC",
      "EUROPE",
    );
  });

  it("shows nothing when the request fails", async () => {
    fetchFreshnessMock.mockRejectedValue(new Error("boom"));

    const { container } = renderNote();
    await vi.waitFor(() => expect(fetchFreshnessMock).toHaveBeenCalled());

    expect(container).toBeEmptyDOMElement();
  });
});
