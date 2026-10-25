import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../../../types/api";

vi.mock("../api/authApi", () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

import * as authApi from "../api/authApi";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./useAuth";

const user: User = {
  id: 1,
  email: "ana@overlab.gg",
  displayName: "Ana",
  role: "USER",
  provider: "LOCAL",
  emailVerified: true,
};

function Probe() {
  const { user: current, loading, signIn, signOut } = useAuth();
  return (
    <div>
      <p>{loading ? "loading" : (current?.displayName ?? "anonymous")}</p>
      <button
        type="button"
        onClick={() => void signIn("ana@overlab.gg", "secret")}
      >
        sign in
      </button>
      <button type="button" onClick={() => void signOut()}>
        sign out
      </button>
    </div>
  );
}

function renderProvider() {
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.mocked(authApi.fetchCurrentUser).mockReset();
    vi.mocked(authApi.login).mockReset();
    vi.mocked(authApi.logout).mockReset();
  });

  it("restores the signed-in user on load", async () => {
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(user);

    renderProvider();

    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByText("Ana")).toBeInTheDocument();
  });

  it("treats a failed session check as anonymous", async () => {
    vi.mocked(authApi.fetchCurrentUser).mockRejectedValue(new Error("401"));

    renderProvider();

    expect(await screen.findByText("anonymous")).toBeInTheDocument();
  });

  it("signs in and then signs out", async () => {
    vi.mocked(authApi.fetchCurrentUser).mockRejectedValue(new Error("401"));
    vi.mocked(authApi.login).mockResolvedValue(user);
    vi.mocked(authApi.logout).mockResolvedValue();
    renderProvider();
    await screen.findByText("anonymous");

    await userEvent.click(screen.getByRole("button", { name: "sign in" }));
    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(authApi.login).toHaveBeenCalledWith("ana@overlab.gg", "secret");

    await userEvent.click(screen.getByRole("button", { name: "sign out" }));
    await waitFor(() =>
      expect(screen.getByText("anonymous")).toBeInTheDocument(),
    );
  });

  it("clears the user even when the logout request fails", async () => {
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(user);
    vi.mocked(authApi.logout).mockRejectedValue(new Error("offline"));
    renderProvider();
    await screen.findByText("Ana");

    await userEvent.click(screen.getByRole("button", { name: "sign out" }));

    await waitFor(() =>
      expect(screen.getByText("anonymous")).toBeInTheDocument(),
    );
  });
});
