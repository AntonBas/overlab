import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../../test/render";

vi.mock("../../api/adminApi", () => ({
  fetchAdminHeroes: vi.fn(() => Promise.resolve([])),
  fetchPerks: vi.fn(() => Promise.resolve([])),
  importPerks: vi.fn(),
  createPerk: vi.fn(),
  updatePerk: vi.fn(),
  deletePerk: vi.fn(),
  uploadPerkIcon: vi.fn(),
  removePerkIcon: vi.fn(),
}));

import { importPerks } from "../../api/adminApi";
import { PerksAdminPage } from "./PerksAdminPage";

describe("PerksAdminPage", () => {
  beforeEach(() => {
    vi.mocked(importPerks).mockReset();
  });

  it("starts the import and tells that it runs in the background", async () => {
    vi.mocked(importPerks).mockResolvedValue({ heroes: 54 });
    renderWithRouter(<PerksAdminPage />);

    await userEvent.click(
      screen.getByRole("button", { name: "Import from Blizzard" }),
    );

    expect(await screen.findByText(/Import started/)).toBeInTheDocument();
    expect(importPerks).toHaveBeenCalledTimes(1);
  });

  it("shows why the import could not start", async () => {
    vi.mocked(importPerks).mockRejectedValue(new Error("disabled"));
    renderWithRouter(<PerksAdminPage />);

    await userEvent.click(
      screen.getByRole("button", { name: "Import from Blizzard" }),
    );

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
