import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../../test/render";
import { patch as buildPatch } from "../../../../test/fixtures/admin";

vi.mock("../api/patchesAdminApi", () => ({
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
} from "../api/patchesAdminApi";
import { PatchesAdminPage } from "./PatchesAdminPage";

const patch = buildPatch();

describe("PatchesAdminPage", () => {
  beforeEach(() => {
    vi.mocked(fetchPatches).mockReset();
    vi.mocked(fetchPatches).mockResolvedValue([patch]);
    vi.mocked(createPatch).mockReset();
    vi.mocked(createPatch).mockResolvedValue(patch);
    vi.mocked(deletePatch).mockReset();
    vi.mocked(deletePatch).mockResolvedValue(undefined);
    vi.mocked(importPatches).mockReset();
    vi.mocked(importPatches).mockResolvedValue({ started: true });
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

  it("starts the patch import in the background", async () => {
    renderWithRouter(<PatchesAdminPage />, "/admin/patches");
    await screen.findByText("2.10");

    await userEvent.click(
      screen.getByRole("button", { name: "Import from Blizzard" }),
    );

    expect(importPatches).toHaveBeenCalled();
    expect(await screen.findByText(/Patch import started/)).toBeInTheDocument();
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
