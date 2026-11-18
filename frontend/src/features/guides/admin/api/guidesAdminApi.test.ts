import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../../services/api";
import {
  createGuide,
  deleteGuide,
  fetchAdminGuides,
  updateGuide,
} from "./guidesAdminApi";
import type { GuidePayload } from "../types";

const payload: GuidePayload = {
  heroSlug: "ana",
  mapSlug: null,
  title: "Sleep dart",
  slug: null,
  youtubeId: "dQw4w9WgXcQ",
  startSeconds: 5,
  endSeconds: null,
  kind: "TIP",
  side: "BOTH",
  abilitySlug: null,
  description: null,
  sortOrder: 0,
  published: true,
};

describe("guidesAdminApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists, creates, updates and deletes guides", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: {} });
    const remove = vi.spyOn(api, "delete").mockResolvedValue({ data: null });

    await fetchAdminGuides();
    await createGuide(payload);
    await updateGuide(8, payload);
    await deleteGuide(8);

    expect(get).toHaveBeenCalledWith("/admin/guides");
    expect(post).toHaveBeenCalledWith("/admin/guides", payload);
    expect(put).toHaveBeenCalledWith("/admin/guides/8", payload);
    expect(remove).toHaveBeenCalledWith("/admin/guides/8");
  });
});
