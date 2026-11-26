import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { renderWithRouter } from "../../test/render";
import { Footer } from "./Footer";
import { fetchGuides } from "../../features/guides";
import type { Guide } from "../../types/guide";

vi.mock("../../features/guides/api/guidesApi", () => ({
  fetchGuides: vi.fn(),
}));

describe("Footer", () => {
  beforeEach(() => {
    vi.mocked(fetchGuides).mockResolvedValue([]);
  });

  it("hides the guides link while there are no guides", async () => {
    renderWithRouter(<Footer />);

    await waitFor(() => expect(fetchGuides).toHaveBeenCalled());

    expect(
      screen.queryByRole("link", { name: "Guides" }),
    ).not.toBeInTheDocument();
  });

  it("links the guides once one is published", async () => {
    vi.mocked(fetchGuides).mockResolvedValue([{} as Guide]);

    renderWithRouter(<Footer />);

    expect(await screen.findByRole("link", { name: "Guides" })).toHaveAttribute(
      "href",
      "/guides",
    );
  });

  it("links the legal pages and carries the Blizzard disclaimer", () => {
    renderWithRouter(<Footer />);

    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/terms",
    );
    expect(screen.getByRole("link", { name: "Cookies" })).toHaveAttribute(
      "href",
      "/cookies",
    );
    expect(
      screen.getByText(/not affiliated with or endorsed by Blizzard/),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithRouter(<Footer />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
