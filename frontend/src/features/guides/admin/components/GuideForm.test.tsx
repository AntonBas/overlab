import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminHero } from "../../../heroes/admin";

vi.mock("../api/guidesAdminApi", () => ({
  createGuide: vi.fn(() => Promise.resolve({})),
  updateGuide: vi.fn(() => Promise.resolve({})),
}));

vi.mock("../../../abilities", () => ({
  fetchHeroAbilities: vi.fn(() => Promise.resolve([])),
}));

import { createGuide, updateGuide } from "../api/guidesAdminApi";
import type { Guide } from "../../../../types/guide";
import { GuideForm } from "./GuideForm";

const heroes: AdminHero[] = [
  {
    slug: "ana",
    name: "Ana",
    role: "SUPPORT",
    subrole: null,
    description: null,
    strengths: null,
    weaknesses: null,
    portraitUrl: null,
    active: true,
  },
];

const mei: AdminHero = {
  ...heroes[0],
  slug: "mei",
  name: "Mei",
  role: "DAMAGE",
};

const savedGuide: Guide = {
  id: 5,
  slug: "nade",
  path: "5-nade",
  heroSlug: "ana",
  heroName: "Ana",
  mapSlug: null,
  mapName: null,
  title: "Nade timing",
  youtubeId: "dQw4w9WgXcQ",
  startSeconds: 83,
  endSeconds: null,
  kind: "SETUP",
  side: "BOTH",
  abilitySlug: "biotic-grenade",
  embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  description: null,
  sortOrder: 0,
  published: true,
  createdAt: "2026-11-01T00:00:00Z",
};

function renderForm(onSaved = vi.fn(), onClose = vi.fn()) {
  render(
    <GuideForm
      guide={null}
      heroes={heroes}
      maps={[]}
      onSaved={onSaved}
      onClose={onClose}
    />,
  );
  return { onSaved, onClose };
}

describe("GuideForm", () => {
  beforeEach(() => {
    vi.mocked(createGuide).mockClear();
  });

  it("submits the video id extracted from a link and the timestamp in seconds", async () => {
    const user = userEvent.setup();
    const { onSaved } = renderForm();

    await user.click(screen.getByRole("combobox", { name: "Hero" }));
    await user.click(screen.getByRole("option", { name: "Ana" }));
    await user.type(screen.getByLabelText("Title"), "Nade timing");
    await user.type(
      screen.getByLabelText("YouTube link"),
      "https://youtu.be/dQw4w9WgXcQ?t=5",
    );
    await user.type(screen.getByLabelText("Start time"), "1:23");
    await user.click(screen.getByLabelText("Published"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(createGuide).toHaveBeenCalledWith(
      expect.objectContaining({
        heroSlug: "ana",
        title: "Nade timing",
        youtubeId: "dQw4w9WgXcQ",
        startSeconds: 83,
        published: true,
        slug: null,
        mapSlug: null,
      }),
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it("blocks submission and explains invalid links and timestamps", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("combobox", { name: "Hero" }));
    await user.click(screen.getByRole("option", { name: "Ana" }));
    await user.type(screen.getByLabelText("Title"), "Nade timing");
    await user.type(screen.getByLabelText("YouTube link"), "not a link");
    await user.type(screen.getByLabelText("Start time"), "1:99");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(createGuide).not.toHaveBeenCalled();
    expect(screen.getByText(/Paste a YouTube link/)).toBeInTheDocument();
    expect(
      screen.getByText("Use the format 1:23 or 1:02:03."),
    ).toBeInTheDocument();
  });

  it("shows server validation errors next to the fields", async () => {
    const user = userEvent.setup();
    vi.mocked(createGuide).mockRejectedValueOnce(
      Object.assign(new Error("Validation failed"), {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            message: "Validation failed",
            subErrors: [
              { field: "slug", message: "must contain lowercase letters" },
            ],
          },
        },
      }),
    );
    renderForm();

    await user.click(screen.getByRole("combobox", { name: "Hero" }));
    await user.click(screen.getByRole("option", { name: "Ana" }));
    await user.type(screen.getByLabelText("Title"), "Nade timing");
    await user.type(screen.getByLabelText("YouTube link"), "dQw4w9WgXcQ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("must contain lowercase letters"),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Fix the highlighted fields",
    );
  });

  it("drops the ability of the previous hero when another hero is chosen", async () => {
    const user = userEvent.setup();
    render(
      <GuideForm
        guide={savedGuide}
        heroes={[...heroes, mei]}
        maps={[]}
        onSaved={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Hero" }));
    await user.click(screen.getByRole("option", { name: "Mei" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateGuide).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ heroSlug: "mei", abilitySlug: null }),
    );
  });
});
