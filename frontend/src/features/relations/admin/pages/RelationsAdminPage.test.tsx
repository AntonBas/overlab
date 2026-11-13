import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../../test/render";

vi.mock("../../../heroes/admin/api/heroesAdminApi", () => ({
  fetchAdminHeroes: vi.fn(() =>
    Promise.resolve([
      { slug: "ana", name: "Ana", role: "SUPPORT", portraitUrl: null },
      { slug: "reaper", name: "Reaper", role: "DAMAGE", portraitUrl: null },
    ]),
  ),
}));

vi.mock("../api/relationsAdminApi", () => ({
  fetchRelations: vi.fn(),
  createRelation: vi.fn(),
  updateRelation: vi.fn(),
  deleteRelation: vi.fn(),
}));

import {
  createRelation,
  deleteRelation,
  fetchRelations,
} from "../api/relationsAdminApi";
import { RelationsAdminPage } from "./RelationsAdminPage";

const relation = {
  id: 9,
  heroSlug: "ana",
  relatedHeroSlug: "reaper",
  type: "COUNTER",
  note: null,
};

async function pickHero(label: string, name: string) {
  await userEvent.click(screen.getByRole("combobox", { name: label }));
  await userEvent.click(screen.getByRole("option", { name }));
}

describe("RelationsAdminPage", () => {
  beforeEach(() => {
    vi.mocked(fetchRelations).mockReset();
    vi.mocked(fetchRelations).mockResolvedValue([relation] as never);
    vi.mocked(createRelation).mockReset();
    vi.mocked(createRelation).mockResolvedValue(relation as never);
    vi.mocked(deleteRelation).mockReset();
    vi.mocked(deleteRelation).mockResolvedValue(undefined as never);
  });

  it("lists relations with hero names", async () => {
    renderWithRouter(<RelationsAdminPage />, "/admin/relations");

    expect(await screen.findByText("Counter")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Reaper")).toBeInTheDocument();
  });

  it("filters relations by hero", async () => {
    renderWithRouter(<RelationsAdminPage />, "/admin/relations");
    await screen.findByText("Counter");

    await screen.findByRole("combobox", { name: "Filter by hero" });
    await pickHero("Filter by hero", "Ana");

    expect(fetchRelations).toHaveBeenCalledWith("ana");
  });

  it("creates a relation between two heroes", async () => {
    renderWithRouter(<RelationsAdminPage />, "/admin/relations");
    await screen.findByText("Counter");
    await screen.findByRole("combobox", { name: "Filter by hero" });

    await userEvent.click(screen.getByRole("button", { name: "New relation" }));
    await userEvent.selectOptions(screen.getByLabelText("Type"), "SYNERGY");
    await pickHero("Hero", "Reaper");
    await pickHero("Related hero", "Ana");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(createRelation).toHaveBeenCalledWith({
      heroSlug: "reaper",
      relatedHeroSlug: "ana",
      type: "SYNERGY",
      note: null,
    });
  });

  it("deletes a relation after confirmation", async () => {
    renderWithRouter(<RelationsAdminPage />, "/admin/relations");
    await screen.findByText("Counter");

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    const buttons = screen.getAllByRole("button", { name: "Delete" });
    await userEvent.click(buttons[buttons.length - 1]);

    expect(deleteRelation).toHaveBeenCalledWith(9);
  });
});
