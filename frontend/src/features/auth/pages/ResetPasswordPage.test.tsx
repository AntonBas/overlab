import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../api/authApi", () => ({
  resetPassword: vi.fn(() => Promise.resolve()),
}));

import { resetPassword } from "../api/authApi";
import { ResetPasswordPage } from "./ResetPasswordPage";

function failure(status: number, data: Record<string, unknown>) {
  return Object.assign(new Error("failed"), {
    isAxiosError: true,
    response: { status, data },
  });
}

async function submitNewPassword() {
  await userEvent.type(screen.getByLabelText(/New password/), "new-password-1");
  await userEvent.click(
    screen.getByRole("button", { name: "Change password" }),
  );
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.mocked(resetPassword).mockReset();
    vi.mocked(resetPassword).mockResolvedValue();
  });

  it("asks for a new link when the token is missing", () => {
    renderWithRouter(<ResetPasswordPage />, "/reset-password");

    expect(screen.getByText("Link is incomplete")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Request a new link" }),
    ).toBeInTheDocument();
  });

  it("changes the password with the token from the link", async () => {
    renderWithRouter(<ResetPasswordPage />, "/reset-password?token=abc");

    await submitNewPassword();

    expect(resetPassword).toHaveBeenCalledWith("abc", "new-password-1");
    expect(await screen.findByText("Password changed")).toBeInTheDocument();
  });

  it("explains an invalid or expired link", async () => {
    vi.mocked(resetPassword).mockRejectedValue(
      failure(400, { message: "Invalid token" }),
    );
    renderWithRouter(<ResetPasswordPage />, "/reset-password?token=abc");

    await submitNewPassword();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This link is invalid or has expired.",
    );
  });
});
