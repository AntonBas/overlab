import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../../test/render";

vi.mock("../../api/adminApi", () => ({
  fetchCollectorJobs: vi.fn(),
  fetchCollectorRuns: vi.fn(),
  runCollectorJob: vi.fn(),
}));

import {
  fetchCollectorJobs,
  fetchCollectorRuns,
  runCollectorJob,
} from "../../api/adminApi";
import { CollectorAdminPage } from "./CollectorAdminPage";

const job = {
  name: "statsCollector",
  cron: "0 0 * * * *",
  enabled: true,
  after: null,
  minInterval: null,
};

const finishedRun = {
  id: 1,
  jobName: "statsCollector",
  trigger: "SCHEDULED",
  status: "SUCCESS",
  startedAt: "2026-01-01T10:00:00Z",
  finishedAt: "2026-01-01T10:01:05Z",
  requestsTotal: 10,
  requestsFailed: 2,
  rowsSaved: 40,
  errorSummary: null,
};

describe("CollectorAdminPage", () => {
  beforeEach(() => {
    vi.mocked(fetchCollectorJobs).mockResolvedValue([job] as never);
    vi.mocked(fetchCollectorRuns).mockResolvedValue([finishedRun] as never);
    vi.mocked(runCollectorJob).mockReset();
    vi.mocked(runCollectorJob).mockResolvedValue({} as never);
  });

  it("shows jobs and the run history with request counts and duration", async () => {
    renderWithRouter(<CollectorAdminPage />, "/admin/collector");

    expect(await screen.findByText("8/10")).toBeInTheDocument();
    expect(screen.getByText("1 min 5 s")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run now" })).toBeEnabled();
  });

  it("asks for confirmation before starting a job", async () => {
    renderWithRouter(<CollectorAdminPage />, "/admin/collector");

    await userEvent.click(
      await screen.findByRole("button", { name: "Run now" }),
    );
    expect(runCollectorJob).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(runCollectorJob).toHaveBeenCalledWith("statsCollector");
  });

  it("disables manual runs while a run is in progress", async () => {
    vi.mocked(fetchCollectorRuns).mockResolvedValue([
      { ...finishedRun, status: "RUNNING", finishedAt: null },
    ] as never);

    renderWithRouter(<CollectorAdminPage />, "/admin/collector");

    expect(await screen.findByText("running")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run now" })).toBeDisabled();
  });
});
