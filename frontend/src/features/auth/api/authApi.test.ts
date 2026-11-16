import { beforeEach, describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("../../../services/api", () => ({ api: http }));

import * as authApi from "./authApi";

describe("authApi", () => {
  beforeEach(() => {
    http.get.mockReset();
    http.post.mockReset();
    http.get.mockResolvedValue({ data: { id: 1 } });
    http.post.mockResolvedValue({ data: { id: 1 } });
  });

  it("reads the current user", async () => {
    await expect(authApi.fetchCurrentUser()).resolves.toEqual({ id: 1 });
    expect(http.get).toHaveBeenCalledWith("/auth/me");
  });

  it("signs in with the email and password", async () => {
    await authApi.login("a@b.test", "secret");
    expect(http.post).toHaveBeenCalledWith("/auth/login", {
      email: "a@b.test",
      password: "secret",
    });
  });

  it("sends the one-time tokens to their endpoints", async () => {
    await authApi.verifyEmail("t1");
    await authApi.resetPassword("t2", "new-password");

    expect(http.post).toHaveBeenCalledWith("/auth/verify-email", {
      token: "t1",
    });
    expect(http.post).toHaveBeenCalledWith("/auth/reset-password", {
      token: "t2",
      password: "new-password",
    });
  });

  it("registers, signs out and asks for emails", async () => {
    await authApi.register({
      email: "a@b.test",
      password: "secret-pass",
      displayName: "Ana",
    });
    await authApi.logout();
    await authApi.resendVerification("a@b.test");
    await authApi.forgotPassword("a@b.test");

    expect(http.post).toHaveBeenCalledWith("/auth/register", {
      email: "a@b.test",
      password: "secret-pass",
      displayName: "Ana",
    });
    expect(http.post).toHaveBeenCalledWith("/auth/logout");
    expect(http.post).toHaveBeenCalledWith("/auth/resend-verification", {
      email: "a@b.test",
    });
    expect(http.post).toHaveBeenCalledWith("/auth/forgot-password", {
      email: "a@b.test",
    });
  });
});
