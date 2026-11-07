import { useState } from "react";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { toFailure } from "../../../services/api";
import { SettingsSection } from "../../account/components/SettingsSection";
import {
  changeRelationReportStatus,
  fetchRelationReports,
  fetchRelationVoteSummary,
} from "../api/adminApi";
import { DataTable } from "../components/DataTable";
import { StatusMessage } from "../components/StatusMessage";
import type {
  RelationReport,
  RelationReportStatus,
  RelationType,
} from "../types";

const STATUSES: RelationReportStatus[] = ["NEW", "ACCEPTED", "REJECTED"];

const TYPE_LABELS: Record<RelationType, string> = {
  COUNTER: "counter",
  SYNERGY: "synergy",
};

function pairLabel(
  heroSlug: string,
  relatedHeroSlug: string,
  type: RelationType,
): string {
  return `${heroSlug} / ${relatedHeroSlug} (${TYPE_LABELS[type]})`;
}

export function FeedbackAdminPage() {
  usePageTitle("Feedback");
  const [status, setStatus] = useState<RelationReportStatus>("NEW");
  const [failure, setFailure] = useState<string | null>(null);
  const reports = useFetch(() => fetchRelationReports(status), [status]);
  const summary = useFetch(() => fetchRelationVoteSummary(), []);

  async function resolve(report: RelationReport, next: RelationReportStatus) {
    setFailure(null);
    try {
      await changeRelationReportStatus(report.id, next);
      reports.reload();
    } catch (error) {
      setFailure(toFailure(error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Feedback"
        subtitle="What users report and vote on counters and synergies"
      />
      <StatusMessage error={failure} />
      <SettingsSection title="Reports">
        <div className="form-field">
          <label htmlFor="report-status">Status</label>
          <select
            id="report-status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as RelationReportStatus)
            }
          >
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        {reports.error && (
          <ErrorMessage failure={reports.error} onRetry={reports.reload} />
        )}
        {reports.loading && <Spinner />}
        {reports.data && (
          <DataTable
            rows={reports.data}
            rowKey={(report) => report.id}
            emptyMessage="No reports with this status."
            columns={[
              {
                header: "Recommendation",
                render: (report) => (
                  <>
                    <span className="nowrap">
                      {pairLabel(
                        report.heroSlug,
                        report.relatedHeroSlug,
                        report.type,
                      )}
                    </span>
                    {report.relationNote && (
                      <p className="muted">{report.relationNote}</p>
                    )}
                  </>
                ),
              },
              {
                header: "Report",
                render: (report) => <p>{report.message}</p>,
              },
              { header: "From", render: (report) => report.reporterName },
              {
                header: "Sent",
                render: (report) => new Date(report.createdAt).toLocaleString(),
              },
              {
                header: "",
                render: (report) => (
                  <div className="form__actions">
                    {report.status !== "ACCEPTED" && (
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => void resolve(report, "ACCEPTED")}
                      >
                        Accept
                      </button>
                    )}
                    {report.status !== "REJECTED" && (
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => void resolve(report, "REJECTED")}
                      >
                        Reject
                      </button>
                    )}
                    {report.status !== "NEW" && (
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => void resolve(report, "NEW")}
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </SettingsSection>
      <SettingsSection
        title="Votes"
        description="Most disagreed recommendations first."
      >
        {summary.error && (
          <ErrorMessage failure={summary.error} onRetry={summary.reload} />
        )}
        {summary.loading && <Spinner />}
        {summary.data && (
          <DataTable
            rows={summary.data}
            rowKey={(row) => row.relationId}
            emptyMessage="No votes yet."
            columns={[
              {
                header: "Recommendation",
                render: (row) =>
                  pairLabel(row.heroSlug, row.relatedHeroSlug, row.type),
              },
              { header: "Agree", render: (row) => row.up },
              { header: "Disagree", render: (row) => row.down },
            ]}
          />
        )}
      </SettingsSection>
    </>
  );
}
