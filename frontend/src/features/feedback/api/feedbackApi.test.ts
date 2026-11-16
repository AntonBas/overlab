import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import { sendBusinessMessage } from "./businessApi";
import { sendFeedback } from "./feedbackApi";

describe("feedback and business APIs", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts a feedback message", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: null });
    const payload = {
      type: "BUG",
      message: "Broken",
      pagePath: "/stats",
    } as const;

    await sendFeedback(payload);

    expect(post).toHaveBeenCalledWith("/feedback", payload);
  });

  it("posts a business message", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: null });
    const payload = { name: "Ana", email: "ana@example.com", message: "Hi" };

    await sendBusinessMessage(payload);

    expect(post).toHaveBeenCalledWith("/business", payload);
  });
});
