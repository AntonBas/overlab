import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../api/authApi", () => ({
  verifyEmail: vi.fn(() => Promise.resolve()),
}));

import { verifyEmail } from "../api/authApi";
import { VerifyEmailPage } from "./VerifyEmailPage";

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    vi.mocked(verifyEmail).mockReset();
    vi.mocked(verifyEmail).mockResolvedValue();
  });

  it("confirms the email with the token from the link", async () => {
    renderWithRouter(<VerifyEmailPage />, "/verify-email?token=abc");

    expect(
      await screen.findByText(/Your email is confirmed/),
    ).toBeInTheDocument();
    expect(verifyEmail).toHaveBeenCalledWith("abc");
  });

  it("reports an invalid or expired link", async () => {
    vi.mocked(verifyEmail).mockRejectedValue(new Error("expired"));
    renderWithRouter(<VerifyEmailPage />, "/verify-email?token=abc");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "invalid or has expired",
    );
  });

  it("reports an incomplete link without calling the api", async () => {
    renderWithRouter(<VerifyEmailPage />, "/verify-email");

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(verifyEmail).not.toHaveBeenCalled();
  });
});
