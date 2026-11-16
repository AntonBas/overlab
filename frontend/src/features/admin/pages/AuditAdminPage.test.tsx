import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";
import { auditEntry, pageOf } from "../../../test/fixtures/admin";

vi.mock("../api/adminApi", () => ({
  fetchAuditLog: vi.fn(),
}));

import { fetchAuditLog } from "../api/adminApi";
import { AuditAdminPage } from "./AuditAdminPage";

describe("AuditAdminPage", () => {
  beforeEach(() => {
    vi.mocked(fetchAuditLog).mockReset();
  });

  it("lists audit entries with the action and entity", async () => {
    vi.mocked(fetchAuditLog).mockResolvedValue(pageOf([auditEntry()]));

    renderWithRouter(<AuditAdminPage />, "/admin/audit");

    expect(await screen.findByText("Delete")).toBeInTheDocument();
    expect(screen.getByText(/Ana Admin/)).toBeInTheDocument();
    expect(screen.getByText(/Guide/)).toBeInTheDocument();
    expect(fetchAuditLog).toHaveBeenCalledWith({ page: 0 });
  });

  it("says when no entries match", async () => {
    vi.mocked(fetchAuditLog).mockResolvedValue(pageOf([]));

    renderWithRouter(<AuditAdminPage />, "/admin/audit");

    expect(
      await screen.findByText("No entries match these filters."),
    ).toBeInTheDocument();
  });
});
