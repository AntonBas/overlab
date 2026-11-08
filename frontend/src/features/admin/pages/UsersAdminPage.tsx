import { useState } from "react";
import { FormField } from "../../../components/ui/FormField";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { formatDateTime, humanize } from "../../../utils/format";
import { useAuth } from "../../auth/context/useAuth";
import { fetchAdminUsers, setUserEnabled, setUserRole } from "../api/adminApi";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Pagination } from "../components/Pagination";
import { StatusMessage } from "../components/StatusMessage";
import { useSave } from "../components/useSave";
import { StatusBadge } from "../components/StatusBadge";
import type { AdminUser } from "../types";

export function UsersAdminPage() {
  usePageTitle("Admin: users");
  const { user: currentUser } = useAuth();
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pending, setPending] = useState<AdminUser | null>(null);
  const [pendingRole, setPendingRole] = useState<AdminUser | null>(null);
  const users = useFetch(() => fetchAdminUsers(query, page), [query, page]);
  const save = useSave();

  async function confirmToggle() {
    if (!pending) {
      return;
    }
    const target = pending;
    const changed = await save.run(
      () => setUserEnabled(target.id, !target.enabled),
      target.enabled
        ? `${target.email} is blocked.`
        : `${target.email} is unblocked.`,
    );
    setPending(null);
    if (changed) {
      users.reload();
    }
  }

  async function confirmRoleChange() {
    if (!pendingRole) {
      return;
    }
    const target = pendingRole;
    const promote = target.role !== "ADMIN";
    const changed = await save.run(
      () => setUserRole(target.id, promote ? "ADMIN" : "USER"),
      promote
        ? `${target.email} is now an admin.`
        : `${target.email} is no longer an admin.`,
    );
    setPendingRole(null);
    if (changed) {
      users.reload();
    }
  }

  return (
    <>
      <PageHeader title="Users" />
      <form
        className="filters"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(0);
          setQuery(draft);
        }}
      >
        <FormField
          label="Search"
          name="query"
          placeholder="Email or name"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className="button">
          Search
        </button>
      </form>
      <StatusMessage error={save.error} />
      {users.loading && <Spinner />}
      {users.error && (
        <ErrorMessage failure={users.error} onRetry={users.reload} />
      )}
      {users.data && users.data.content.length === 0 && (
        <p className="notice">No users match this search.</p>
      )}
      {users.data && users.data.content.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Sign-in</th>
                <th scope="col">Last sign-in</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.data.content.map((entry) => (
                <tr key={entry.id}>
                  <th scope="row">
                    {entry.displayName}
                    <span className="muted"> {entry.email}</span>
                  </th>
                  <td>{humanize(entry.role)}</td>
                  <td>{humanize(entry.provider)}</td>
                  <td>
                    {entry.lastLoginAt
                      ? formatDateTime(entry.lastLoginAt)
                      : "never"}
                  </td>
                  <td>
                    <StatusBadge
                      value={entry.enabled ? "Active" : "Blocked"}
                      tone={entry.enabled ? "good" : "bad"}
                    />
                  </td>
                  <td>
                    {entry.id !== currentUser?.id && (
                      <>
                        <button
                          type="button"
                          className="button button--ghost"
                          onClick={() => setPendingRole(entry)}
                        >
                          {entry.role === "ADMIN"
                            ? "Remove admin"
                            : "Make admin"}
                        </button>
                        <button
                          type="button"
                          className="button button--ghost"
                          onClick={() => setPending(entry)}
                        >
                          {entry.enabled ? "Block" : "Unblock"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {users.data && (
        <Pagination
          page={page}
          totalPages={users.data.totalPages}
          onChange={setPage}
        />
      )}
      {pending && (
        <ConfirmDialog
          title={pending.enabled ? "Block this user?" : "Unblock this user?"}
          message={
            pending.enabled
              ? `${pending.email} will be signed out and will not be able to sign in.`
              : `${pending.email} will be able to sign in again.`
          }
          confirmLabel={pending.enabled ? "Block" : "Unblock"}
          busy={save.saving}
          onConfirm={() => void confirmToggle()}
          onCancel={() => setPending(null)}
        />
      )}
      {pendingRole && (
        <ConfirmDialog
          title={
            pendingRole.role === "ADMIN"
              ? "Remove admin rights?"
              : "Make this user an admin?"
          }
          message={
            pendingRole.role === "ADMIN"
              ? `${pendingRole.email} will lose access to the admin panel and will be signed out.`
              : `${pendingRole.email} will get full access to the admin panel.`
          }
          confirmLabel={
            pendingRole.role === "ADMIN" ? "Remove admin" : "Make admin"
          }
          busy={save.saving}
          onConfirm={() => void confirmRoleChange()}
          onCancel={() => setPendingRole(null)}
        />
      )}
    </>
  );
}
