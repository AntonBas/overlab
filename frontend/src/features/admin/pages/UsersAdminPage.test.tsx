import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";
import type { AdminUser } from "../types";

vi.mock("../api/adminApi", () => ({
  fetchAdminUsers: vi.fn(),
  setUserEnabled: vi.fn(),
}));
vi.mock("../../auth/context/useAuth", () => ({
  useAuth: () => ({
    user: { id: 1, email: "admin@overlab.gg" },
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    replaceUser: vi.fn(),
  }),
}));

import { fetchAdminUsers, setUserEnabled } from "../api/adminApi";
import { UsersAdminPage } from "./UsersAdminPage";

function user(overrides: Partial<AdminUser>): AdminUser {
  return {
    id: 2,
    email: "ana@overlab.gg",
    displayName: "Ana",
    role: "USER",
    provider: "LOCAL",
    emailVerified: true,
    enabled: true,
    createdAt: "2026-10-01T10:00:00Z",
    lastLoginAt: null,
    ...overrides,
  };
}

describe("UsersAdminPage", () => {
  beforeEach(() => {
    vi.mocked(fetchAdminUsers).mockReset();
    vi.mocked(setUserEnabled).mockReset();
    vi.mocked(fetchAdminUsers).mockResolvedValue({
      content: [user({ id: 1, email: "admin@overlab.gg" }), user({})],
      page: 0,
      size: 25,
      totalElements: 2,
      totalPages: 1,
    });
  });

  it("does not offer to block the signed-in administrator", async () => {
    renderWithRouter(<UsersAdminPage />, "/admin/users");

    expect(await screen.findByText("ana@overlab.gg")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Block" })).toHaveLength(1);
  });

  it("blocks a user after confirmation", async () => {
    vi.mocked(setUserEnabled).mockResolvedValue(user({ enabled: false }));
    renderWithRouter(<UsersAdminPage />, "/admin/users");

    await userEvent.click(await screen.findByRole("button", { name: "Block" }));
    await userEvent.click(
      screen.getByRole("dialog").querySelector("button.button--danger")!,
    );

    expect(setUserEnabled).toHaveBeenCalledWith(2, false);
  });
});
