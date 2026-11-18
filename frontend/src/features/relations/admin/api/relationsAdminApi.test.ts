import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../../services/api";
import {
  createCategory,
  createCategoryMatchup,
  createRelation,
  deleteCategory,
  deleteCategoryMatchup,
  deleteRelation,
  fetchCategories,
  fetchCategoryMatchups,
  fetchRelations,
  fetchRelationVoteSummary,
  updateCategory,
  updateCategoryMatchup,
  updateRelation,
} from "./relationsAdminApi";

const relation = {
  heroSlug: "ana",
  relatedHeroSlug: "reaper",
  type: "COUNTER",
  note: null,
} as const;
const category = {
  slug: "divers",
  name: "Divers",
  description: null,
  heroSlugs: ["winston"],
};
const matchup = {
  heroSlug: "ana",
  categorySlug: "divers",
  type: "WEAK_AGAINST",
  note: null,
} as const;

describe("relationsAdminApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("filters relations by hero only when a hero is given", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

    await fetchRelations();
    await fetchRelations("ana");

    expect(get).toHaveBeenNthCalledWith(1, "/admin/hero-relations", {
      params: undefined,
    });
    expect(get).toHaveBeenNthCalledWith(2, "/admin/hero-relations", {
      params: { hero: "ana" },
    });
  });

  it("creates, updates and deletes relations", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: {} });
    const remove = vi.spyOn(api, "delete").mockResolvedValue({ data: null });

    await createRelation(relation);
    await updateRelation(9, relation);
    await deleteRelation(9);

    expect(post).toHaveBeenCalledWith("/admin/hero-relations", relation);
    expect(put).toHaveBeenCalledWith("/admin/hero-relations/9", relation);
    expect(remove).toHaveBeenCalledWith("/admin/hero-relations/9");
  });

  it("manages hero categories", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: {} });
    const remove = vi.spyOn(api, "delete").mockResolvedValue({ data: null });

    await fetchCategories();
    await createCategory(category);
    await updateCategory(2, category);
    await deleteCategory(2);

    expect(get).toHaveBeenCalledWith("/admin/hero-categories");
    expect(post).toHaveBeenCalledWith("/admin/hero-categories", category);
    expect(put).toHaveBeenCalledWith("/admin/hero-categories/2", category);
    expect(remove).toHaveBeenCalledWith("/admin/hero-categories/2");
  });

  it("manages category matchups", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: {} });
    const remove = vi.spyOn(api, "delete").mockResolvedValue({ data: null });

    await fetchCategoryMatchups();
    await createCategoryMatchup(matchup);
    await updateCategoryMatchup(4, matchup);
    await deleteCategoryMatchup(4);

    expect(get).toHaveBeenCalledWith("/admin/hero-category-relations");
    expect(post).toHaveBeenCalledWith(
      "/admin/hero-category-relations",
      matchup,
    );
    expect(put).toHaveBeenCalledWith(
      "/admin/hero-category-relations/4",
      matchup,
    );
    expect(remove).toHaveBeenCalledWith("/admin/hero-category-relations/4");
  });

  it("reads the vote summary", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

    await fetchRelationVoteSummary();

    expect(get).toHaveBeenCalledWith("/admin/relation-votes/summary");
  });
});
