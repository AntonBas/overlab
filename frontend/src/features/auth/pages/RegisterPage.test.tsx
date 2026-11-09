import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../api/authApi", () => ({
  register: vi.fn(() => Promise.resolve({})),
}));

import { register } from "../api/authApi";
import { RegisterPage } from "./RegisterPage";

async function fill(password: string, confirmation: string) {
  await userEvent.type(screen.getByLabelText("Display name"), "Ana");
  await userEvent.type(screen.getByLabelText("Email"), "ana@overlab.gg");
  await userEvent.type(screen.getByLabelText("Password"), password);
  await userEvent.type(screen.getByLabelText("Confirm password"), confirmation);
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));
}

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.mocked(register).mockClear();
  });

  it("does not send the form when the passwords differ", async () => {
    renderWithRouter(<RegisterPage />);

    await fill("secret-password", "secret-passw0rd");

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("registers when both passwords match", async () => {
    renderWithRouter(<RegisterPage />);

    await fill("secret-password", "secret-password");

    expect(register).toHaveBeenCalledWith({
      displayName: "Ana",
      email: "ana@overlab.gg",
      password: "secret-password",
    });
    expect(await screen.findByText("Check your email")).toBeInTheDocument();
  });
});
