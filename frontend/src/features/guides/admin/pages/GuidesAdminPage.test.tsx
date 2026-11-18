import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { guide } from "../../../../test/fixtures/guides";
import { renderWithRouter } from "../../../../test/render";

vi.mock("../api/guidesAdminApi", () => ({
  fetchAdminGuides: vi.fn(),
  deleteGuide: vi.fn(),
}));

vi.mock("../../../maps/admin/api/mapsAdminApi", () => ({
  fetchAdminMaps: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../../../heroes/admin/api/heroesAdminApi", () => ({
  fetchAdminHeroes: vi.fn(() =>
    Promise.resolve([
      { slug: "ana", name: "Ana", role: "SUPPORT", portraitUrl: null },
      { slug: "reaper", name: "Reaper", role: "DAMAGE", portraitUrl: null },
    ]),
  ),
}));
vi.mock("../components/GuideForm", () => ({
  GuideForm: () => <div>guide form</div>,
}));

import { deleteGuide, fetchAdminGuides } from "../api/guidesAdminApi";
import { GuidesAdminPage } from "./GuidesAdminPage";

function guideRow(id: number, title: string, heroSlug: string) {
  return guide({
    id,
    title,
    heroSlug,
    heroName: heroSlug,
    path: `guide-${id}`,
    sortOrder: id,
    published: id === 1,
  });
}

async function pickHero(label: string, name: string) {
  await userEvent.click(screen.getByRole("combobox", { name: label }));
  await userEvent.click(screen.getByRole("option", { name }));
}

describe("GuidesAdminPage", () => {
  beforeEach(() => {
    vi.mocked(fetchAdminGuides).mockReset();
    vi.mocked(fetchAdminGuides).mockResolvedValue([
      guideRow(1, "Ana nade", "ana"),
      guideRow(2, "Reaper flank", "reaper"),
    ]);
    vi.mocked(deleteGuide).mockReset();
    vi.mocked(deleteGuide).mockResolvedValue(undefined);
  });

  it("lists guides and filters them by hero", async () => {
    renderWithRouter(<GuidesAdminPage />, "/admin/guides");

    expect(await screen.findByText("Ana nade")).toBeInTheDocument();
    expect(screen.getByText("Reaper flank")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Published" })).toHaveAttribute(
      "href",
      "/guides/guide-1",
    );

    await screen.findByRole("combobox", { name: "Filter by hero" });
    await pickHero("Filter by hero", "Ana");

    expect(screen.queryByText("Reaper flank")).not.toBeInTheDocument();
  });

  it("opens the form for a new guide", async () => {
    renderWithRouter(<GuidesAdminPage />, "/admin/guides");
    await screen.findByText("Ana nade");
    await screen.findByRole("combobox", { name: "Filter by hero" });

    await userEvent.click(screen.getByRole("button", { name: "New guide" }));

    expect(screen.getByText("guide form")).toBeInTheDocument();
  });

  it("deletes a guide only after confirmation", async () => {
    renderWithRouter(<GuidesAdminPage />, "/admin/guides");
    await screen.findByText("Ana nade");

    await userEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    expect(deleteGuide).not.toHaveBeenCalled();
    const buttons = screen.getAllByRole("button", { name: "Delete" });
    await userEvent.click(buttons[buttons.length - 1]);

    expect(deleteGuide).toHaveBeenCalledWith(1);
  });
});
