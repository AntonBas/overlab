import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../api/mapsApi", () => ({
  fetchMaps: vi.fn(() =>
    Promise.resolve([
      {
        slug: "busan",
        name: "Busan",
        mode: "CONTROL",
        imageUrl: "/media/maps/busan-1.webp",
      },
      { slug: "rialto", name: "Rialto", mode: "ESCORT", imageUrl: null },
    ]),
  ),
}));

import { MapsPage } from "./MapsPage";

describe("MapsPage", () => {
  it("shows a card with the image for a map that has one", async () => {
    const { container } = renderWithRouter(<MapsPage />);

    const link = await screen.findByRole("link", { name: "Busan" });

    expect(link).toHaveAttribute("href", "/maps/busan");
    expect(
      container.querySelector('img[src="/media/maps/busan-1.webp"]'),
    ).not.toBeNull();
  });

  it("still lists a map without an image", async () => {
    const { container } = renderWithRouter(<MapsPage />);

    expect(await screen.findByRole("link", { name: "Rialto" })).toBeVisible();
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });
});
