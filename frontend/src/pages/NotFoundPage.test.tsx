import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../test/render";
import { NotFoundPage } from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("explains the page is missing and links to the statistics", () => {
    renderWithRouter(<NotFoundPage />, "/nope");

    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to the statistics" }),
    ).toHaveAttribute("href", "/stats");
  });
});
