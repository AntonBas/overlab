import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../test/render";

vi.mock("../../features/auth/context/useAuth", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));
vi.mock("../../features/heroes/api/heroesApi", () => ({
  fetchHeroes: vi.fn(() => Promise.resolve([])),
}));

import { Header } from "./Header";

describe("Header", () => {
  it("toggles the compact menu and closes it after choosing a page", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Header />);

    const toggle = screen.getByRole("button", { name: "Menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("link", { name: "Heroes" }));
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("offers a single sign in button to anonymous visitors", () => {
    renderWithRouter(<Header />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(
      screen.queryByRole("link", { name: "Create account" }),
    ).not.toBeInTheDocument();
  });

  it("hides the admin link from anonymous visitors", () => {
    renderWithRouter(<Header />);
    expect(
      screen.queryByRole("link", { name: "Admin" }),
    ).not.toBeInTheDocument();
  });
});
