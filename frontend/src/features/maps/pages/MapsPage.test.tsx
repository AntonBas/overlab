import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { gameMap } from "../../../test/fixtures/maps";
import { renderWithRouter } from "../../../test/render";

const personal = vi.hoisted(() => ({ favoriteMaps: new Set<string>() }));

vi.mock("../../personal/context/usePersonalData", () => ({
  usePersonalData: () => ({
    favoriteMaps: personal.favoriteMaps,
    toggleMapFavorite: vi.fn(),
    failure: null,
  }),
}));
vi.mock("../../auth/context/useAuth", () => ({
  useAuth: () => ({ user: { id: 1 } }),
}));
vi.mock("../api/mapsApi", () => ({
  fetchMaps: vi.fn(() =>
    Promise.resolve([
      gameMap({ imageUrl: "/media/maps/busan-1.webp" }),
      gameMap({ slug: "rialto", name: "Rialto", mode: "ESCORT" }),
      gameMap({ slug: "havana", name: "Havana", mode: "ESCORT" }),
    ]),
  ),
}));

import { MapsPage } from "./MapsPage";

describe("MapsPage", () => {
  beforeEach(() => {
    personal.favoriteMaps = new Set();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithRouter(<MapsPage />);

    await screen.findByRole("link", { name: /Busan/ });

    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows a card with the image for a map that has one", async () => {
    const { container } = renderWithRouter(<MapsPage />);

    const link = await screen.findByRole("link", { name: /Busan/ });

    expect(link).toHaveAttribute("href", "/maps/busan");
    expect(
      container.querySelector('img[src="/media/maps/busan-1.webp"]'),
    ).not.toBeNull();
  });

  it("shows the placeholder image for a map without an image", async () => {
    const { container } = renderWithRouter(<MapsPage />);

    expect(await screen.findByRole("link", { name: /Rialto/ })).toBeVisible();
    expect(
      container.querySelector('img[src="/images/map-placeholder.svg"]'),
    ).not.toBeNull();
  });

  it("filters the maps by name", async () => {
    renderWithRouter(<MapsPage />);
    await screen.findByRole("link", { name: /Busan/ });

    await userEvent.type(screen.getByRole("searchbox"), "ria");

    expect(screen.getByRole("link", { name: /Rialto/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Busan/ }),
    ).not.toBeInTheDocument();
  });

  it("filters the maps by mode", async () => {
    renderWithRouter(<MapsPage />);
    await screen.findByRole("link", { name: /Busan/ });

    await userEvent.click(screen.getByRole("button", { name: "Escort" }));

    expect(
      screen.queryByRole("link", { name: /Busan/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Havana/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Escort" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("says when nothing matches", async () => {
    renderWithRouter(<MapsPage />);
    await screen.findByRole("link", { name: /Busan/ });

    await userEvent.type(screen.getByRole("searchbox"), "zzz");

    expect(
      screen.getByText("No maps match these filters."),
    ).toBeInTheDocument();
  });

  it("shows only favorite maps when asked", async () => {
    personal.favoriteMaps = new Set(["havana"]);
    renderWithRouter(<MapsPage />);
    await screen.findByRole("link", { name: /Busan/ });

    await userEvent.click(
      screen.getByRole("button", { name: /only favorites/i }),
    );

    expect(screen.getByRole("link", { name: /Havana/ })).toBeVisible();
    expect(screen.queryByRole("link", { name: /Busan/ })).toBeNull();
  });
});
