import { beforeEach, describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({
  delete: vi.fn(),
  post: vi.fn(),
}));

vi.mock("../../../services/api", () => ({ api: http }));

import { deleteAccount, requestAccountDeletion } from "./accountApi";

describe("accountApi", () => {
  beforeEach(() => {
    http.delete.mockReset();
    http.post.mockReset();
    http.delete.mockResolvedValue({});
    http.post.mockResolvedValue({});
  });

  it("deletes the account with the password or the emailed token", async () => {
    await deleteAccount("secret", null);
    await deleteAccount(null, "token-1");

    expect(http.delete).toHaveBeenCalledWith("/me", {
      data: { password: "secret", deletionToken: null },
    });
    expect(http.delete).toHaveBeenCalledWith("/me", {
      data: { password: null, deletionToken: "token-1" },
    });
  });

  it("asks for the deletion link", async () => {
    await requestAccountDeletion();

    expect(http.post).toHaveBeenCalledWith("/me/delete-request");
  });
});
