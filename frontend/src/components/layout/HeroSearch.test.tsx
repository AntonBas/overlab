import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../test/render";

vi.mock("../../features/heroes/api/heroesApi", () => ({
  fetchHeroes: vi.fn(() =>
    Promise.resolve([
      {
        slug: "ana",
        name: "Ana",
        role: "SUPPORT",
        subrole: null,
        description: null,
        portraitUrl: null,
      },
      {
        slug: "mercy",
        name: "Mercy",
        role: "SUPPORT",
        subrole: null,
        description: null,
        portraitUrl: null,
      },
      {
        slug: "mei",
        name: "Mei",
        role: "DAMAGE",
        subrole: null,
        description: null,
        portraitUrl: null,
      },
    ]),
  ),
}));

import { HeroSearch } from "./HeroSearch";

function Location() {
  return <p>at {useLocation().pathname}</p>;
}

function renderSearch() {
  renderWithRouter(
    <>
      <HeroSearch />
      <Routes>
        <Route path="*" element={<Location />} />
      </Routes>
    </>,
  );
}

describe("HeroSearch", () => {
  it("opens a hero page with the keyboard only", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.tab();
    await user.keyboard("me");
    expect(await screen.findAllByRole("option")).toHaveLength(2);
    await user.keyboard("{ArrowDown}{Enter}");

    expect(screen.getByText("at /heroes/mei")).toBeInTheDocument();
  });

  it("opens the first match on Enter", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.tab();
    await user.keyboard("an");
    await screen.findByRole("option", { name: "Ana" });
    await user.keyboard("{Enter}");

    expect(screen.getByText("at /heroes/ana")).toBeInTheDocument();
  });

  it("closes the list on Escape", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.tab();
    await user.keyboard("m");
    await screen.findByRole("option", { name: "Mei" });
    await user.keyboard("{Escape}");

    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
