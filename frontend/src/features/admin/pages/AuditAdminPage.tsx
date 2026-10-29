import { useState } from "react";
import { FormField } from "../../../components/ui/FormField";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { humanize } from "../../../utils/format";
import { fetchAuditLog } from "../api/adminApi";
import { ChangeView } from "../components/ChangeView";
import { SelectField } from "../components/Fields";
import { Pagination } from "../components/Pagination";
import type { AuditAction, AuditFilters } from "../types";

const ACTIONS: AuditAction[] = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "PASSWORD_CHANGE",
];

const EMPTY: AuditFilters = { page: 0 };

export function AuditAdminPage() {
  usePageTitle("Admin: audit log");
  const [draft, setDraft] = useState<AuditFilters>(EMPTY);
  const [applied, setApplied] = useState<AuditFilters>(EMPTY);
  const log = useFetch(() => fetchAuditLog(applied), [applied]);

  function change(key: keyof AuditFilters, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <>
      <PageHeader title="Audit log" />
      <form
        className="filters"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied({ ...draft, page: 0 });
        }}
      >
        <FormField
          label="Entity"
          name="entityType"
          placeholder="Hero, Guide..."
          value={draft.entityType ?? ""}
          onChange={(event) => change("entityType", event.target.value)}
        />
        <FormField
          label="Actor id"
          name="actorId"
          inputMode="numeric"
          value={draft.actorId ?? ""}
          onChange={(event) => change("actorId", event.target.value)}
        />
        <SelectField
          label="Action"
          name="action"
          value={draft.action ?? ""}
          onChange={(event) => change("action", event.target.value)}
        >
          <option value="">Any</option>
          {ACTIONS.map((value) => (
            <option key={value} value={value}>
              {humanize(value)}
            </option>
          ))}
        </SelectField>
        <FormField
          label="From"
          name="from"
          type="datetime-local"
          value={draft.from ?? ""}
          onChange={(event) => change("from", event.target.value)}
        />
        <FormField
          label="To"
          name="to"
          type="datetime-local"
          value={draft.to ?? ""}
          onChange={(event) => change("to", event.target.value)}
        />
        <button type="submit" className="button">
          Apply
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => {
            setDraft(EMPTY);
            setApplied(EMPTY);
          }}
        >
          Reset
        </button>
      </form>
      {log.loading && <Spinner />}
      {log.error && <ErrorMessage failure={log.error} onRetry={log.reload} />}
      {log.data && log.data.content.length === 0 && (
        <p className="notice">No entries match these filters.</p>
      )}
      {log.data && log.data.content.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Actor</th>
                <th scope="col">Action</th>
                <th scope="col">Entity</th>
                <th scope="col">Changes</th>
              </tr>
            </thead>
            <tbody>
              {log.data.content.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.occurredAt).toLocaleString()}</td>
                  <td>
                    {entry.actorId ?? "system"}
                    {entry.actorRole && (
                      <span className="muted"> ({entry.actorRole})</span>
                    )}
                  </td>
                  <td>{humanize(entry.action)}</td>
                  <td>
                    {entry.entityType}
                    {entry.entityId && (
                      <span className="muted"> {entry.entityId}</span>
                    )}
                  </td>
                  <td>
                    <ChangeView action={entry.action} changes={entry.changes} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {log.data && (
        <Pagination
          page={applied.page}
          totalPages={log.data.totalPages}
          onChange={(page) => setApplied((current) => ({ ...current, page }))}
        />
      )}
    </>
  );
}
