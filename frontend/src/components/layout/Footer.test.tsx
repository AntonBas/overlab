import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../../test/render";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("hides the support link while no support address is configured", () => {
    renderWithRouter(<Footer />);
    expect(
      screen.queryByRole("link", { name: /Support the site/ }),
    ).not.toBeInTheDocument();
  });
});
