import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../../services/api";
import {
  fetchAdminUsers,
  fetchAuditLog,
  fetchCollectorJobs,
  fetchCollectorRuns,
  runCollectorJob,
  setUserEnabled,
  setUserRole,
} from "./adminApi";

describe("adminApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads collector jobs and runs and starts a job by name", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: {} });

    await fetchCollectorJobs();
    await fetchCollectorRuns();
    await runCollectorJob("statsCollector");

    expect(get).toHaveBeenCalledWith("/admin/collector/jobs");
    expect(get).toHaveBeenCalledWith("/admin/collector/runs");
    expect(post).toHaveBeenCalledWith(
      "/admin/collector/jobs/statsCollector/run",
    );
  });

  it("drops empty audit filters and sends dates as ISO instants", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: {} });

    await fetchAuditLog({
      entityType: "",
      actorId: "7",
      from: "2026-01-01T10:00:00Z",
      page: 2,
    });

    expect(get).toHaveBeenCalledWith("/admin/audit", {
      params: {
        entityType: undefined,
        actorId: "7",
        action: undefined,
        from: "2026-01-01T10:00:00.000Z",
        to: undefined,
        page: 2,
        size: 25,
      },
    });
  });

  it("maps user filters to query parameters and drops empty ones", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: {} });

    await fetchAdminUsers({
      query: "ana",
      role: "",
      enabled: "true",
      emailVerified: "",
      provider: "",
      sort: "createdAt",
      direction: "desc",
      page: 0,
    });

    expect(get).toHaveBeenCalledWith("/admin/users", {
      params: {
        q: "ana",
        role: undefined,
        enabled: "true",
        emailVerified: undefined,
        provider: undefined,
        sort: "createdAt",
        direction: "desc",
        page: 0,
        size: 25,
      },
    });
  });

  it("changes the enabled flag and the role of a user", async () => {
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: {} });

    await setUserEnabled(3, false);
    await setUserRole(3, "ADMIN");

    expect(put).toHaveBeenNthCalledWith(1, "/admin/users/3/enabled", {
      enabled: false,
    });
    expect(put).toHaveBeenNthCalledWith(2, "/admin/users/3/role", {
      role: "ADMIN",
    });
  });
});
