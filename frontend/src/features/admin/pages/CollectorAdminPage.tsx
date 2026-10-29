import { useEffect, useState } from "react";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { humanize } from "../../../utils/format";
import {
  fetchCollectorJobs,
  fetchCollectorRuns,
  runCollectorJob,
} from "../api/adminApi";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DataTable } from "../components/DataTable";
import { StatusMessage } from "../components/StatusMessage";
import { useSave } from "../components/useSave";
import type { CollectorJob } from "../types";

const POLL_INTERVAL_MS = 3000;

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
      <StatusMessage error={start.error} success={start.success} />
      {jobs.loading && <Spinner />}
      {jobs.error && (
        <ErrorMessage failure={jobs.error} onRetry={jobs.reload} />
      )}
      {jobs.data && (
        <DataTable
          rows={jobs.data}
          rowKey={(job) => job.name}
          columns={[
            { header: "Job", render: (job) => job.name },
            { header: "Schedule", render: (job) => <code>{job.cron}</code> },
            {
              header: "Enabled",
              render: (job) => (job.enabled ? "Yes" : "No"),
            },
            {
              header: "",
              render: (job) => (
                <button
                  type="button"
                  className="button"
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
            { header: "Job", render: (run) => run.jobName },
            { header: "Trigger", render: (run) => humanize(run.trigger) },
            { header: "Status", render: (run) => humanize(run.status) },
            {
              header: "Started",
              render: (run) => new Date(run.startedAt).toLocaleString(),
            },
            {
              header: "Requests",
              render: (run) =>
                `${run.requestsTotal - run.requestsFailed}/${run.requestsTotal}`,
            },
            { header: "Rows", render: (run) => run.rowsSaved },
            { header: "Error", render: (run) => run.errorSummary ?? "" },
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
