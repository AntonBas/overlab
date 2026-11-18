import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { gameMap } from "../../../../test/fixtures/maps";
import { renderWithRouter } from "../../../../test/render";

vi.mock("../api/mapsAdminApi", () => ({
  fetchAdminMaps: vi.fn(),
  updateMap: vi.fn(),
  uploadMapImage: vi.fn(),
  removeMapImage: vi.fn(),
}));

import { fetchAdminMaps, updateMap } from "../api/mapsAdminApi";
import { MapsAdminPage } from "./MapsAdminPage";

describe("MapsAdminPage", () => {
  beforeEach(() => {
    vi.mocked(fetchAdminMaps).mockReset();
    vi.mocked(fetchAdminMaps).mockResolvedValue([
      { slug: "numbani", name: "Numbani", imageUrl: null, mode: "HYBRID" },
      { slug: "ilios", name: "Ilios", imageUrl: null, mode: null },
    ]);
    vi.mocked(updateMap).mockReset();
    vi.mocked(updateMap).mockResolvedValue(gameMap());
  });

  it("lists maps with their mode", async () => {
    renderWithRouter(<MapsAdminPage />, "/admin/maps");

    expect(await screen.findByText("Numbani")).toBeInTheDocument();
    expect(screen.getByText("Ilios")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("saves the chosen mode for a map", async () => {
    renderWithRouter(<MapsAdminPage />, "/admin/maps");
    await screen.findByText("Ilios");

    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    await userEvent.click(editButtons[1]);
    await userEvent.selectOptions(screen.getByLabelText("Mode"), "CONTROL");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(updateMap).toHaveBeenCalledWith("ilios", { mode: "CONTROL" });
  });
});
