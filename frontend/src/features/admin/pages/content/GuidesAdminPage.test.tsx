import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../../test/render";

vi.mock("../../api/adminApi", () => ({
  fetchAdminGuides: vi.fn(),
  fetchAdminMaps: vi.fn(() => Promise.resolve([])),
  fetchAdminHeroes: vi.fn(() =>
    Promise.resolve([
      { slug: "ana", name: "Ana", role: "SUPPORT", portraitUrl: null },
      { slug: "reaper", name: "Reaper", role: "DAMAGE", portraitUrl: null },
    ]),
  ),
  deleteGuide: vi.fn(),
}));
vi.mock("../../components/forms/GuideForm", () => ({
  GuideForm: () => <div>guide form</div>,
}));

import { deleteGuide, fetchAdminGuides } from "../../api/adminApi";
import { GuidesAdminPage } from "./GuidesAdminPage";

function guide(id: number, title: string, heroSlug: string) {
  return {
    id,
    title,
    heroSlug,
    heroName: heroSlug,
    mapName: null,
    path: `guide-${id}`,
    sortOrder: id,
    published: id === 1,
  };
}

async function pickHero(label: string, name: string) {
  await userEvent.click(screen.getByRole("combobox", { name: label }));
  await userEvent.click(screen.getByRole("option", { name }));
}

describe("GuidesAdminPage", () => {
  beforeEach(() => {
    vi.mocked(fetchAdminGuides).mockReset();
    vi.mocked(fetchAdminGuides).mockResolvedValue([
      guide(1, "Ana nade", "ana"),
      guide(2, "Reaper flank", "reaper"),
    ] as never);
    vi.mocked(deleteGuide).mockReset();
    vi.mocked(deleteGuide).mockResolvedValue(undefined as never);
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
