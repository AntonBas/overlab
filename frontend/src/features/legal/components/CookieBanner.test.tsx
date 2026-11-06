import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { getConsent, resetConsent } from "../consent/consentStore";
import { CookieBanner } from "./CookieBanner";

function renderBanner() {
  return render(
    <MemoryRouter>
      <CookieBanner />
    </MemoryRouter>,
  );
}

describe("CookieBanner", () => {
  beforeEach(() => {
    resetConsent();
  });

  it("shows until a choice is made and starts with optional cookies off", () => {
    renderBanner();
    expect(screen.getByText(/only the cookies needed/i)).toBeInTheDocument();
    expect(getConsent()).toEqual({
      analytics: false,
      advertising: false,
      decided: false,
    });
  });

  it("stores a rejection and hides itself", async () => {
    renderBanner();
    await userEvent.click(
      screen.getByRole("button", { name: "Necessary only" }),
    );
    expect(getConsent()).toEqual({
      analytics: false,
      advertising: false,
      decided: true,
    });
    expect(screen.queryByText(/only the cookies needed/i)).toBeNull();
  });

  it("stores acceptance of all categories", async () => {
    renderBanner();
    await userEvent.click(screen.getByRole("button", { name: "Accept all" }));
    expect(getConsent()).toEqual({
      analytics: true,
      advertising: true,
      decided: true,
    });
  });
});
