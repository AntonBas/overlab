import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../api/adminApi", () => ({
  fetchAdminHeroes: vi.fn(() =>
    Promise.resolve([
      {
        slug: "reinhardt",
        name: "Reinhardt",
        role: "TANK",
        subrole: null,
        description: null,
        strengths: null,
        weaknesses: null,
        portraitUrl: null,
        active: true,
      },
    ]),
  ),
  fetchAdminAbilities: vi.fn(() =>
    Promise.resolve([
      {
        id: 1,
        heroSlug: "reinhardt",
        name: "Charge",
        iconUrl: null,
        control: "ABILITY_1",
      },
      {
        id: 2,
        heroSlug: "reinhardt",
        name: "Earthshatter",
        iconUrl: null,
        control: null,
      },
    ]),
  ),
  updateAbilityControl: vi.fn(),
}));

import { updateAbilityControl } from "../api/adminApi";
import { AbilitiesAdminPage } from "./AbilitiesAdminPage";

describe("AbilitiesAdminPage", () => {
  beforeEach(() => {
    vi.mocked(updateAbilityControl).mockReset();
  });

  it("lists the abilities of the first hero with their current slot", async () => {
    renderWithRouter(<AbilitiesAdminPage />);

    expect(await screen.findByText("Charge")).toBeInTheDocument();
    expect(screen.getByLabelText("Control of Charge")).toHaveValue("ABILITY_1");
    expect(screen.getByLabelText("Control of Earthshatter")).toHaveValue("");
  });

  it("saves the chosen slot right away", async () => {
    vi.mocked(updateAbilityControl).mockResolvedValue({
      id: 2,
      heroSlug: "reinhardt",
      name: "Earthshatter",
      iconUrl: null,
      control: "ULTIMATE",
    });
    renderWithRouter(<AbilitiesAdminPage />);

    await userEvent.selectOptions(
      await screen.findByLabelText("Control of Earthshatter"),
      "ULTIMATE",
    );

    await waitFor(() =>
      expect(updateAbilityControl).toHaveBeenCalledWith(2, "ULTIMATE"),
    );
    expect(await screen.findByText("Earthshatter saved.")).toBeInTheDocument();
  });

  it("clears the slot when Not set is chosen", async () => {
    vi.mocked(updateAbilityControl).mockResolvedValue({
      id: 1,
      heroSlug: "reinhardt",
      name: "Charge",
      iconUrl: null,
      control: null,
    });
    renderWithRouter(<AbilitiesAdminPage />);

    await userEvent.selectOptions(
      await screen.findByLabelText("Control of Charge"),
      "",
    );

    await waitFor(() =>
      expect(updateAbilityControl).toHaveBeenCalledWith(1, null),
    );
  });
});
