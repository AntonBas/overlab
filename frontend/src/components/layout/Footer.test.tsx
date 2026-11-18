import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { renderWithRouter } from "../../test/render";
import { Footer } from "./Footer";

describe("Footer", () => {
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
