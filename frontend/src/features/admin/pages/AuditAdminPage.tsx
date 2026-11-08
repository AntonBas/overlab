import { useState } from "react";
import { FormField } from "../../../components/ui/FormField";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { formatDateTime, humanize } from "../../../utils/format";
import { fetchAuditLog } from "../api/adminApi";
import { ChangeView } from "../components/ChangeView";
import { SelectField } from "../components/ui/Fields";
import { Pagination } from "../components/ui/Pagination";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { AuditAction, AuditFilters } from "../types";
import { describeActor, describeEntity } from "../utils/audit";
import "../admin.css";

const ACTIONS: AuditAction[] = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "PASSWORD_CHANGE",
];

const ACTION_TONES: Record<AuditAction, "good" | "bad" | "info" | "neutral"> = {
  CREATE: "good",
  UPDATE: "info",
  DELETE: "bad",
  LOGIN: "neutral",
  LOGOUT: "neutral",
  PASSWORD_CHANGE: "neutral",
};

const EMPTY: Omit<AuditFilters, "page"> = {};

export function AuditAdminPage() {
  usePageTitle("Admin: audit log");
  const [fields, setFields] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const applied = useDebouncedValue(fields, 400);
  const log = useFetch(
    () => fetchAuditLog({ ...applied, page }),
    [applied, page],
  );
  const filtered = Object.values(fields).some(Boolean);

  function change(key: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setPage(0);
  }

  return (
    <>
      <PageHeader title="Audit log" />
      <div className="filters">
        <FormField
          label="Entity"
          name="entityType"
          placeholder="Hero, Guide..."
          value={fields.entityType ?? ""}
          onChange={(event) => change("entityType", event.target.value)}
        />
        <FormField
          label="Actor id"
          name="actorId"
          inputMode="numeric"
          value={fields.actorId ?? ""}
          onChange={(event) => change("actorId", event.target.value)}
        />
        <SelectField
          label="Action"
          name="action"
          value={fields.action ?? ""}
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
          value={fields.from ?? ""}
          onChange={(event) => change("from", event.target.value)}
        />
        <FormField
          label="To"
          name="to"
          type="datetime-local"
          value={fields.to ?? ""}
          onChange={(event) => change("to", event.target.value)}
        />
        {filtered && (
          <button
            type="button"
            className="button button--ghost"
            onClick={() => {
              setFields(EMPTY);
              setPage(0);
            }}
          >
            Reset
          </button>
        )}
      </div>
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
                  <td className="nowrap">{formatDateTime(entry.occurredAt)}</td>
                  <td>{describeActor(entry.actorId, entry.actorRole)}</td>
                  <td>
                    <StatusBadge
                      value={entry.action}
                      tone={ACTION_TONES[entry.action]}
                    />
                  </td>
                  <td>{describeEntity(entry.entityType, entry.entityId)}</td>
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
          page={page}
          totalPages={log.data.totalPages}
          onChange={setPage}
        />
      )}
    </>
  );
}
