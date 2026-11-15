import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { Spinner } from "../../../../components/ui/Spinner";
import { useFetch } from "../../../../hooks/useFetch";
import { usePageTitle } from "../../../../hooks/usePageTitle";
import { toFailure } from "../../../../services/api";
import { SettingsSection } from "../../../account";
import { changeFeedbackStatus, fetchFeedback } from "../api/feedbackAdminApi";
import { fetchRelationVoteSummary } from "../../../relations/admin";
import { DataTable } from "../../../../components/admin/DataTable";
import { StatusMessage } from "../../../../components/admin/StatusMessage";
import type { FeedbackMessage, FeedbackStatus, FeedbackType } from "../types";
import type { RelationType } from "../../../relations/admin";
import { formatDateTime } from "../../../../utils/format";

const STATUSES: FeedbackStatus[] = ["NEW", "RESOLVED", "DISMISSED"];

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  NEW: "New",
  RESOLVED: "Resolved",
  DISMISSED: "Dismissed",
};

const TYPE_LABELS: Record<FeedbackType, string> = {
  INACCURACY: "Inaccuracy",
  BUG: "Bug",
  TYPO: "Typo",
  OTHER: "Other",
  BUSINESS: "Business",
};

const RELATION_LABELS: Record<RelationType, string> = {
  COUNTER: "counter",
  SYNERGY: "synergy",
};

export function FeedbackAdminPage() {
  usePageTitle("Feedback");
  const [status, setStatus] = useState<FeedbackStatus>("NEW");
  const [failure, setFailure] = useState<string | null>(null);
  const messages = useFetch(() => fetchFeedback(status), [status]);
  const summary = useFetch(() => fetchRelationVoteSummary(), []);

  async function change(message: FeedbackMessage, next: FeedbackStatus) {
    setFailure(null);
    try {
      await changeFeedbackStatus(message.id, next);
      messages.reload();
    } catch (error) {
      setFailure(toFailure(error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Feedback"
        subtitle="What visitors write and how they vote on counters and synergies"
      />
      <StatusMessage error={failure} />
      <SettingsSection title="Messages">
        <div className="form-field">
          <label htmlFor="feedback-status">Status</label>
          <select
            id="feedback-status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as FeedbackStatus)
            }
          >
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
        {messages.error && (
          <ErrorMessage failure={messages.error} onRetry={messages.reload} />
        )}
        {messages.loading && <Spinner />}
        {messages.data && (
          <DataTable
            rows={messages.data}
            rowKey={(message) => message.id}
            emptyMessage="No messages with this status."
            columns={[
              { header: "Type", render: (row) => TYPE_LABELS[row.type] },
              { header: "Message", render: (row) => <p>{row.message}</p> },
              {
                header: "Page",
                render: (row) =>
                  row.pagePath ? (
                    <Link to={row.pagePath}>{row.pagePath}</Link>
                  ) : (
                    ""
                  ),
              },
              {
                header: "From",
                render: (row) =>
                  row.contactEmail ? (
                    <a href={`mailto:${row.contactEmail}`}>
                      {row.authorName ?? row.contactEmail}
                    </a>
                  ) : (
                    (row.authorName ?? "Guest")
                  ),
              },
              {
                header: "Sent",
                render: (row) => formatDateTime(row.createdAt),
              },
              {
                header: "",
                render: (row) => (
                  <div className="form__actions">
                    {row.status !== "RESOLVED" && (
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => void change(row, "RESOLVED")}
                      >
                        Resolve
                      </button>
                    )}
                    {row.status !== "DISMISSED" && (
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => void change(row, "DISMISSED")}
                      >
                        Dismiss
                      </button>
                    )}
                    {row.status !== "NEW" && (
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => void change(row, "NEW")}
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
                  `${row.heroSlug} / ${row.relatedHeroSlug} (${RELATION_LABELS[row.type]})`,
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
