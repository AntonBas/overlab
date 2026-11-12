import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../../test/render";

vi.mock("../../api/adminApi", () => ({
  fetchPatches: vi.fn(),
  createPatch: vi.fn(),
  updatePatch: vi.fn(),
  deletePatch: vi.fn(),
  importPatches: vi.fn(),
}));

import {
  createPatch,
  deletePatch,
  fetchPatches,
  importPatches,
} from "../../api/adminApi";
import { PatchesAdminPage } from "./PatchesAdminPage";

const patch = {
  id: 3,
  version: "2.10",
  slug: "2-10",
  title: "Big balance",
  season: null,
  releasedAt: "2026-01-01T10:00:00Z",
  notes: null,
};

describe("PatchesAdminPage", () => {
  beforeEach(() => {
    vi.mocked(fetchPatches).mockReset();
    vi.mocked(fetchPatches).mockResolvedValue([patch] as never);
    vi.mocked(createPatch).mockReset();
    vi.mocked(createPatch).mockResolvedValue(patch as never);
    vi.mocked(deletePatch).mockReset();
    vi.mocked(deletePatch).mockResolvedValue(undefined as never);
    vi.mocked(importPatches).mockReset();
    vi.mocked(importPatches).mockResolvedValue({ created: 2 });
  });

  it("lists patches", async () => {
    renderWithRouter(<PatchesAdminPage />, "/admin/patches");

    expect(await screen.findByText("2.10")).toBeInTheDocument();
    expect(screen.getByText("Big balance")).toBeInTheDocument();
  });

  it("creates a patch from the form", async () => {
    renderWithRouter(<PatchesAdminPage />, "/admin/patches");
    await screen.findByText("2.10");

    await userEvent.click(screen.getByRole("button", { name: "New patch" }));
    await userEvent.type(screen.getByLabelText(/Version/), "2.11");
    await userEvent.type(
      screen.getByLabelText(/Released at/),
      "2026-02-01T10:00",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(createPatch).toHaveBeenCalledWith(
      expect.objectContaining({ version: "2.11", slug: null, title: null }),
    );
  });

  it("imports patches and reloads the list", async () => {
    renderWithRouter(<PatchesAdminPage />, "/admin/patches");
    await screen.findByText("2.10");

    await userEvent.click(
      screen.getByRole("button", { name: "Import from Blizzard" }),
    );

    expect(importPatches).toHaveBeenCalled();
    expect(fetchPatches).toHaveBeenCalledTimes(2);
  });

  it("deletes a patch after confirmation", async () => {
    renderWithRouter(<PatchesAdminPage />, "/admin/patches");
    await screen.findByText("2.10");

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    const buttons = screen.getAllByRole("button", { name: "Delete" });
    await userEvent.click(buttons[buttons.length - 1]);

    expect(deletePatch).toHaveBeenCalledWith(3);
  });
});
