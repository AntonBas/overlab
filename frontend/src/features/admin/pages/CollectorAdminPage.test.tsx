import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";
import { collectorJob, collectorRun } from "../../../test/fixtures/admin";

vi.mock("../api/adminApi", () => ({
  fetchCollectorJobs: vi.fn(),
  fetchCollectorRuns: vi.fn(),
  runCollectorJob: vi.fn(),
}));

import {
  fetchCollectorJobs,
  fetchCollectorRuns,
  runCollectorJob,
} from "../api/adminApi";
import { CollectorAdminPage } from "./CollectorAdminPage";

const job = collectorJob();
const finishedRun = collectorRun();

describe("CollectorAdminPage", () => {
  beforeEach(() => {
    vi.mocked(fetchCollectorJobs).mockResolvedValue([job]);
    vi.mocked(fetchCollectorRuns).mockResolvedValue([finishedRun]);
    vi.mocked(runCollectorJob).mockReset();
    vi.mocked(runCollectorJob).mockResolvedValue(finishedRun);
  });

  it("shows jobs and the run history with request counts and duration", async () => {
    renderWithRouter(<CollectorAdminPage />, "/admin/collector");

    expect(await screen.findByText("8/10")).toBeInTheDocument();
    expect(screen.getByText("1 min 5 s")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Run now/ })).toBeEnabled();
  });

  it("asks for confirmation before starting a job", async () => {
    renderWithRouter(<CollectorAdminPage />, "/admin/collector");

    await userEvent.click(
      await screen.findByRole("button", { name: /^Run now/ }),
    );
    expect(runCollectorJob).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Run" }));

    expect(runCollectorJob).toHaveBeenCalledWith("statsCollector");
  });

  it("disables manual runs while a run is in progress", async () => {
    vi.mocked(fetchCollectorRuns).mockResolvedValue([
      { ...finishedRun, status: "RUNNING", finishedAt: null },
    ]);

    renderWithRouter(<CollectorAdminPage />, "/admin/collector");

    expect(await screen.findByText("running")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Run now/ })).toBeDisabled();
  });
});
