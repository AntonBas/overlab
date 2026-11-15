import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../api/adminApi", () => ({
  fetchAuditLog: vi.fn(),
  fetchUserDirectory: vi.fn(),
}));

import { fetchAuditLog, fetchUserDirectory } from "../api/adminApi";
import { AuditAdminPage } from "./AuditAdminPage";

function auditPage(content: unknown[]) {
  return {
    content,
    page: 0,
    size: 20,
    totalElements: content.length,
    totalPages: 1,
  };
}

describe("AuditAdminPage", () => {
  beforeEach(() => {
    vi.mocked(fetchAuditLog).mockReset();
    vi.mocked(fetchUserDirectory).mockReset();
    vi.mocked(fetchUserDirectory).mockResolvedValue([]);
  });

  it("lists audit entries with the action and entity", async () => {
    vi.mocked(fetchAuditLog).mockResolvedValue(
      auditPage([
        {
          id: 1,
          occurredAt: "2026-01-01T10:00:00Z",
          actorId: 7,
          actorRole: "ADMIN",
          action: "DELETE",
          entityType: "Guide",
          entityId: "12",
          changes: null,
          ipAddress: null,
        },
      ]) as never,
    );

    renderWithRouter(<AuditAdminPage />, "/admin/audit");

    expect(await screen.findByText("Delete")).toBeInTheDocument();
    expect(screen.getByText(/Guide/)).toBeInTheDocument();
    expect(fetchAuditLog).toHaveBeenCalledWith({ page: 0 });
  });

  it("says when no entries match", async () => {
    vi.mocked(fetchAuditLog).mockResolvedValue(auditPage([]) as never);

    renderWithRouter(<AuditAdminPage />, "/admin/audit");

    expect(
      await screen.findByText("No entries match these filters."),
    ).toBeInTheDocument();
  });
});
