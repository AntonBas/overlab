import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../components/CookieSettings", () => ({
  CookieSettings: () => <div>cookie settings</div>,
}));

import { CookiesPage } from "./CookiesPage";
import { PrivacyPage } from "./PrivacyPage";
import { TermsPage } from "./TermsPage";

describe("legal pages", () => {
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
});
