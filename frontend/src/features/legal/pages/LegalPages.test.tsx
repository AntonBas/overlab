import { screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../components/CookieSettings", () => ({
  CookieSettings: () => <div>cookie settings</div>,
}));

vi.mock("../contact", () => ({
  contactEmail: undefined,
  controllerName: "Test Operator",
  controllerAddress: "1 Test Street, Test City",
}));

import { CookiesPage } from "./CookiesPage";
import { PrivacyPage } from "./PrivacyPage";
import { TermsPage } from "./TermsPage";

describe("legal pages", () => {
  it.each([
    ["cookies", <CookiesPage key="cookies" />],
    ["privacy", <PrivacyPage key="privacy" />],
    ["terms", <TermsPage key="terms" />],
  ])("%s page has no accessibility violations", async (_name, page) => {
    const { container } = renderWithRouter(page, "/legal");

    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders the cookie policy with the cookie settings", () => {
    renderWithRouter(<CookiesPage />, "/cookies");

    expect(
      screen.getByRole("heading", { level: 1, name: "Cookie policy" }),
    ).toBeInTheDocument();
    expect(screen.getByText("cookie settings")).toBeInTheDocument();
  });

  it("renders the privacy policy", () => {
    renderWithRouter(<PrivacyPage />, "/privacy");

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).length).toBeGreaterThan(
      0,
    );
  });

  it("renders the terms of use", () => {
    renderWithRouter(<TermsPage />, "/terms");

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).length).toBeGreaterThan(
      0,
    );
  });

  it.each([
    ["cookies", <CookiesPage key="cookies" />],
    ["privacy", <PrivacyPage key="privacy" />],
    ["terms", <TermsPage key="terms" />],
  ])("%s page shows the last updated date", (_name, page) => {
    renderWithRouter(page, "/legal");

    expect(screen.getByText(/^Last updated \d{1,2} \w+ \d{4}$/)).toBeVisible();
  });

  it.each([
    ["privacy", <PrivacyPage key="privacy" />],
    ["terms", <TermsPage key="terms" />],
  ])(
    "%s page points to the feedback form without a contact email",
    (_name, page) => {
      renderWithRouter(page, "/legal");

      expect(
        screen.getByRole("link", { name: "feedback form" }),
      ).toHaveAttribute("href", "/feedback");
    },
  );

  it("lists local storage entries separately from cookies", () => {
    renderWithRouter(<CookiesPage />, "/cookies");

    expect(
      screen.getByRole("heading", { level: 2, name: "Local storage" }),
    ).toBeInTheDocument();
    expect(screen.getByText("overlab.controlScheme")).toBeInTheDocument();
    expect(screen.getByText("overlab.region")).toBeInTheDocument();
  });
});
