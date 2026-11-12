import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../../test/render";

vi.mock("../../api/adminApi", () => ({
  fetchAdminHeroes: vi.fn(() =>
    Promise.resolve([
      {
        slug: "zarya",
        name: "Zarya",
        role: "TANK",
        subrole: null,
        description: null,
        strengths: null,
        weaknesses: null,
        portraitUrl: null,
        active: true,
      },
      {
        slug: "pharah",
        name: "Pharah",
        role: "DAMAGE",
        subrole: null,
        description: null,
        strengths: null,
        weaknesses: null,
        portraitUrl: null,
        active: true,
      },
    ]),
  ),
  fetchCategories: vi.fn(() =>
    Promise.resolve([
      {
        id: 1,
        slug: "beam",
        name: "Beam",
        description: null,
        heroSlugs: ["zarya"],
      },
    ]),
  ),
  fetchCategoryMatchups: vi.fn(() =>
    Promise.resolve([
      {
        id: 7,
        heroSlug: "pharah",
        categorySlug: "beam",
        type: "WEAK_AGAINST",
        note: null,
      },
    ]),
  ),
  createCategory: vi.fn(() => Promise.resolve({})),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  createCategoryMatchup: vi.fn(),
  updateCategoryMatchup: vi.fn(),
  deleteCategoryMatchup: vi.fn(),
}));

import { createCategory } from "../../api/adminApi";
import { CategoriesAdminPage } from "./CategoriesAdminPage";

describe("CategoriesAdminPage", () => {
  beforeEach(() => {
    vi.mocked(createCategory).mockClear();
  });

  it("lists categories and matchups with readable names", async () => {
    renderWithRouter(<CategoriesAdminPage />);

    expect(await screen.findByText("beam")).toBeInTheDocument();
    expect(screen.getByText("Pharah")).toBeInTheDocument();
    expect(screen.getByText("Struggles against")).toBeInTheDocument();
  });

  it("saves a new category with the ticked heroes", async () => {
    const user = userEvent.setup();
    renderWithRouter(<CategoriesAdminPage />);
    await screen.findByText("beam");

    await user.click(screen.getByRole("button", { name: "New category" }));
    const form = await screen.findByRole("heading", { name: "New category" });
    const drawer = form.closest("form") as HTMLElement;
    await user.type(within(drawer).getByLabelText("Name"), "Dive");
    await user.type(within(drawer).getByLabelText("Slug"), "dive");
    await user.click(within(drawer).getByLabelText("Pharah"));
    await user.click(within(drawer).getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(createCategory).toHaveBeenCalledWith({
        slug: "dive",
        name: "Dive",
        description: null,
        heroSlugs: ["pharah"],
      }),
    );
  });

  it("blocks a second matchup for the same hero and category", async () => {
    const user = userEvent.setup();
    renderWithRouter(<CategoriesAdminPage />);
    await screen.findByText("beam");

    await user.click(screen.getByRole("button", { name: "New matchup" }));
    const form = (
      await screen.findByRole("heading", { name: "New matchup" })
    ).closest("form") as HTMLElement;
    await user.selectOptions(within(form).getByLabelText("Hero"), "pharah");
    await user.selectOptions(within(form).getByLabelText("Category"), "beam");

    expect(within(form).getByText(/already has a matchup/)).toBeInTheDocument();
    expect(within(form).getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
