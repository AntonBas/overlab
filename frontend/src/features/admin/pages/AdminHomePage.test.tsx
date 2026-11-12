import { screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../../../test/render";
import { ADMIN_SECTIONS } from "../components/adminSections";
import { AdminHomePage } from "./AdminHomePage";

describe("AdminHomePage", () => {
  it("has no accessibility violations", async () => {
    const { container } = renderWithRouter(<AdminHomePage />, "/admin");

    expect(await axe(container)).toHaveNoViolations();
  });

  it("links to every admin section", () => {
    renderWithRouter(<AdminHomePage />, "/admin");

    ADMIN_SECTIONS.forEach((section) => {
      expect(
        screen.getByRole("link", { name: new RegExp(section.label) }),
      ).toHaveAttribute("href", section.to);
    });
  });
});
