import { useEffect, useState } from "react";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { Spinner } from "../../../../components/ui/Spinner";
import { useFetch } from "../../../../hooks/useFetch";
import { usePageTitle } from "../../../../hooks/usePageTitle";
import { formatDateTime, humanize } from "../../../../utils/format";
import {
  fetchCollectorJobs,
  fetchCollectorRuns,
  runCollectorJob,
} from "../../api/adminApi";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { StatusMessage } from "../../components/ui/StatusMessage";
import { useSave } from "../../components/forms/useSave";
import type { CollectorJob, CollectorRunStatus } from "../../types";
import { describeCron, describeInterval } from "../../utils/cron";
import { splitWords } from "../../utils/audit";

const POLL_INTERVAL_MS = 3000;

const STATUS_TONES: Record<
  CollectorRunStatus,
  "good" | "bad" | "warning" | "info"
> = {
  SUCCESS: "good",
  FAILED: "bad",
  PARTIAL: "warning",
  RUNNING: "info",
};

function formatDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) {
    return "running";
  }
  const seconds = Math.max(
    0,
    Math.round(
      (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000,
    ),
  );
  if (seconds < 60) {
    return `${seconds} s`;
  }
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
}

export function CollectorAdminPage() {
  usePageTitle("Admin: collector");
  const jobs = useFetch(fetchCollectorJobs, []);
  const runs = useFetch(fetchCollectorRuns, []);
  const [confirming, setConfirming] = useState<CollectorJob | null>(null);
  const start = useSave();
  const running = runs.data?.some((run) => run.status === "RUNNING") ?? false;
  const reloadRuns = runs.reload;

  useEffect(() => {
    if (!running) {
      return undefined;
    }
    const timer = window.setInterval(reloadRuns, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [running, reloadRuns]);

  async function confirmRun() {
    if (!confirming) {
      return;
    }
    const name = confirming.name;
    const started = await start.run(
      () => runCollectorJob(name),
      `Job ${name} started.`,
    );
    if (started) {
      reloadRuns();
    }
    setConfirming(null);
  }

  return (
    <>
      <PageHeader
        title="Collector"
        subtitle="Manual runs send many requests to Blizzard. Use them sparingly."
      />
      <StatusMessage error={start.error} />
      {jobs.loading && <Spinner />}
      {jobs.error && (
        <ErrorMessage failure={jobs.error} onRetry={jobs.reload} />
      )}
      {jobs.data && (
        <DataTable
          rows={jobs.data}
          rowKey={(job) => job.name}
          columns={[
            { header: "Job", render: (job) => splitWords(job.name) },
            {
              header: "Schedule",
              render: (job) => {
                if (!job.cron) {
                  return (
                    <>
                      After {splitWords(job.after ?? "")} finds changes
                      {job.minInterval && (
                        <>
                          <br />
                          <span className="muted">
                            at most once per {describeInterval(job.minInterval)}
                          </span>
                        </>
                      )}
                    </>
                  );
                }
                const description = describeCron(job.cron);
                return description ? (
                  <>
                    {description}
                    <br />
                    <code className="muted">{job.cron}</code>
                  </>
                ) : (
                  <code>{job.cron}</code>
                );
              },
            },
            {
              header: "Enabled",
              render: (job) => (
                <StatusBadge
                  value={job.enabled ? "Enabled" : "Disabled"}
                  tone={job.enabled ? "good" : "neutral"}
                />
              ),
            },
            {
              header: "",
              render: (job) => (
                <button
                  type="button"
                  className="button button--ghost"
                  disabled={running || start.saving}
                  onClick={() => setConfirming(job)}
                >
                  Run now
                </button>
              ),
            },
          ]}
        />
      )}
      <h2 className="section">Run history</h2>
      {running && <Spinner label="A run is in progress" />}
      {runs.error && (
        <ErrorMessage failure={runs.error} onRetry={runs.reload} />
      )}
      {runs.data && (
        <DataTable
          rows={runs.data}
          rowKey={(run) => run.id}
          emptyMessage="No runs yet."
          columns={[
            {
              header: "Job",
              render: (run) => (
                <>
                  {splitWords(run.jobName)}
                  <br />
                  <span className="muted">{humanize(run.trigger)}</span>
                </>
              ),
            },
            {
              header: "Status",
              render: (run) => (
                <StatusBadge
                  value={run.status}
                  tone={STATUS_TONES[run.status]}
                />
              ),
            },
            {
              header: "Started",
              render: (run) => (
                <span className="nowrap">
                  {formatDateTime(run.startedAt)}
                  <br />
                  <span className="muted">
                    {formatDuration(run.startedAt, run.finishedAt)}
                  </span>
                </span>
              ),
            },
            {
              header: "Requests",
              render: (run) =>
                `${run.requestsTotal - run.requestsFailed}/${run.requestsTotal}`,
            },
            { header: "Rows saved", render: (run) => run.rowsSaved },
            {
              header: "Error",
              render: (run) =>
                run.errorSummary && (
                  <span className="table__error">{run.errorSummary}</span>
                ),
            },
          ]}
        />
      )}
      {confirming && (
        <ConfirmDialog
          title="Run collector"
          message={`Start ${confirming.name} now? It sends many requests to Blizzard and should not be repeated often.`}
          confirmLabel="Run"
          busy={start.saving}
          onConfirm={() => void confirmRun()}
          onCancel={() => setConfirming(null)}
        />
      )}
    </>
  );
}
