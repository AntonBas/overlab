import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../api/authApi", () => ({
  forgotPassword: vi.fn(() => Promise.resolve()),
}));

import { forgotPassword } from "../api/authApi";
import { ForgotPasswordPage } from "./ForgotPasswordPage";

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.mocked(forgotPassword).mockReset();
    vi.mocked(forgotPassword).mockResolvedValue();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithRouter(<ForgotPasswordPage />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("requests a reset link and shows the neutral confirmation", async () => {
    renderWithRouter(<ForgotPasswordPage />);

    await userEvent.type(screen.getByLabelText("Email"), "ana@overlab.gg");
    await userEvent.click(
      screen.getByRole("button", { name: "Send the link" }),
    );

    expect(forgotPassword).toHaveBeenCalledWith("ana@overlab.gg");
    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(screen.getByText("ana@overlab.gg")).toBeInTheDocument();
  });

  it("shows the same confirmation when the request fails", async () => {
    vi.mocked(forgotPassword).mockRejectedValue(new Error("boom"));
    renderWithRouter(<ForgotPasswordPage />);

    await userEvent.type(screen.getByLabelText("Email"), "ana@overlab.gg");
    await userEvent.click(
      screen.getByRole("button", { name: "Send the link" }),
    );

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
  });
});
