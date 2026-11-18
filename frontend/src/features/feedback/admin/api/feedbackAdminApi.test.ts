import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../../services/api";
import { changeFeedbackStatus, fetchFeedback } from "./feedbackAdminApi";

describe("feedbackAdminApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists messages by status", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

    await fetchFeedback("NEW");

    expect(get).toHaveBeenCalledWith("/admin/feedback", {
      params: { status: "NEW" },
    });
  });

  it("changes the status of a message", async () => {
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: null });

    await changeFeedbackStatus(5, "RESOLVED");

    expect(put).toHaveBeenCalledWith("/admin/feedback/5/status", {
      status: "RESOLVED",
    });
  });
});
