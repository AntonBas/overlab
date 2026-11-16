import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

const auth = vi.hoisted(() => ({
  state: { user: { provider: "GOOGLE" }, replaceUser: vi.fn() },
}));

vi.mock("../../auth", () => ({ useAuth: () => auth.state }));
vi.mock("../api/accountApi", () => ({
  deleteAccount: vi.fn(() => Promise.resolve()),
  requestAccountDeletion: vi.fn(() => Promise.resolve()),
}));

import { deleteAccount, requestAccountDeletion } from "../api/accountApi";
import { DeleteAccount } from "./DeleteAccount";

describe("DeleteAccount", () => {
  beforeEach(() => {
    vi.mocked(deleteAccount).mockClear();
    vi.mocked(requestAccountDeletion).mockClear();
  });

  it("asks an account without a password for an emailed link instead of its address", async () => {
    auth.state = { user: { provider: "GOOGLE" }, replaceUser: vi.fn() };
    renderWithRouter(<DeleteAccount />);

    await userEvent.click(
      screen.getByRole("button", { name: "Delete my account" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Email me the link" }),
    );

    expect(requestAccountDeletion).toHaveBeenCalled();
    expect(deleteAccount).not.toHaveBeenCalled();
    expect(await screen.findByText(/We emailed you a link/)).toBeVisible();
  });

  it("deletes a local account with its password", async () => {
    const replaceUser = vi.fn();
    auth.state = { user: { provider: "LOCAL" }, replaceUser };
    renderWithRouter(<DeleteAccount />);

    await userEvent.click(
      screen.getByRole("button", { name: "Delete my account" }),
    );
    await userEvent.type(
      screen.getByLabelText("Enter your password to confirm"),
      "secret-password",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Delete permanently" }),
    );

    expect(deleteAccount).toHaveBeenCalledWith("secret-password", null);
    expect(replaceUser).toHaveBeenCalledWith(null);
  });
});
