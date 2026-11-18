import { screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../test/render";
import { NotFoundPage } from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("has no accessibility violations", async () => {
    const { container } = renderWithRouter(<NotFoundPage />, "/nope");

    expect(await axe(container)).toHaveNoViolations();
  });

  it("explains the page is missing and links onward", () => {
    renderWithRouter(<NotFoundPage />, "/nope");

    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to heroes" })).toHaveAttribute(
      "href",
      "/heroes",
    );
    expect(screen.getByRole("link", { name: "Statistics" })).toHaveAttribute(
      "href",
      "/stats",
    );
  });
});
