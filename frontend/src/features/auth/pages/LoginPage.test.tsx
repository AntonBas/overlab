import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { renderWithRouter } from "../../../test/render";

vi.mock("../api/authApi", () => ({
  resendVerification: vi.fn(() => Promise.resolve()),
}));

const signIn = vi.fn();
vi.mock("../context/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false, signIn, signOut: vi.fn() }),
}));

import { resendVerification } from "../api/authApi";
import { LoginPage } from "./LoginPage";

function failure(status: number, message: string) {
  return Object.assign(new Error(message), {
    isAxiosError: true,
    response: { status, data: { message } },
  });
}

function renderLogin() {
  return renderWithRouter(
    <Routes>
      <Route path="/" element={<p>home page</p>} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>,
    "/login",
  );
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText("Email"), "ana@overlab.gg");
  await userEvent.type(screen.getByLabelText("Password"), "secret-password");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginPage", () => {
  beforeEach(() => {
    signIn.mockReset();
    vi.mocked(resendVerification).mockClear();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderLogin();

    expect(await axe(container)).toHaveNoViolations();
  });

  it("signs in and goes to the home page", async () => {
    signIn.mockResolvedValue({});
    renderLogin();

    await fillAndSubmit();

    expect(signIn).toHaveBeenCalledWith("ana@overlab.gg", "secret-password");
    expect(await screen.findByText("home page")).toBeInTheDocument();
  });

  it("shows the server message for wrong credentials", async () => {
    signIn.mockRejectedValue(failure(401, "Invalid email or password"));
    renderLogin();

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password",
    );
    expect(
      screen.queryByRole("button", { name: /confirmation email/i }),
    ).not.toBeInTheDocument();
  });

  it("offers to resend the confirmation email when the address is not confirmed", async () => {
    signIn.mockRejectedValue(failure(403, "Email is not verified"));
    renderLogin();

    await fillAndSubmit();
    await userEvent.click(
      await screen.findByRole("button", { name: /confirmation email/i }),
    );

    expect(resendVerification).toHaveBeenCalledWith("ana@overlab.gg");
    expect(
      await screen.findByText(/new confirmation email/),
    ).toBeInTheDocument();
  });

  it("asks the visitor to wait when rate limited", async () => {
    signIn.mockRejectedValue(failure(429, "Too many requests"));
    renderLogin();

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent("Wait a minute");
  });

  it("links to registration, password reset and Google sign-in", () => {
    renderLogin();

    expect(screen.getByRole("link", { name: "Create one" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(
      screen.getByRole("link", { name: "Forgot your password?" }),
    ).toHaveAttribute("href", "/forgot-password");
    expect(
      screen.getByRole("link", { name: "Continue with Google" }),
    ).toHaveAttribute("href", "/oauth2/authorization/google");
  });
});
