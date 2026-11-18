import { EmptyState } from "../../../components/ui/EmptyState";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { FormField } from "../../../components/ui/FormField";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Spinner } from "../../../components/ui/Spinner";
import { useFetch } from "../../../hooks/useFetch";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useResettingPage } from "../../../hooks/useResettingPage";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { formatDateTime, humanize } from "../../../utils/format";
import { useAuth } from "../../auth";
import { fetchAdminUsers, setUserEnabled, setUserRole } from "../api/adminApi";
import { ConfirmDialog } from "../../../components/admin/ConfirmDialog";
import { SelectField } from "../../../components/admin/Fields";
import { Pagination } from "../../../components/admin/Pagination";
import { StatusMessage } from "../../../components/admin/StatusMessage";
import { useSave } from "../../../components/admin/useSave";
import { StatusBadge } from "../../../components/admin/StatusBadge";
import type { AdminUser } from "../types";

interface UserFilterForm {
  query: string;
  role: string;
  enabled: string;
  emailVerified: string;
  provider: string;
  sort: string;
}

const EMPTY_FILTERS: UserFilterForm = {
  query: "",
  role: "",
  enabled: "",
  emailVerified: "",
  provider: "",
  sort: "newest",
};

const SORTS: Record<string, { column: string; direction: "asc" | "desc" }> = {
  newest: { column: "createdAt", direction: "desc" },
  oldest: { column: "createdAt", direction: "asc" },
  lastLogin: { column: "lastLoginAt", direction: "desc" },
  name: { column: "displayName", direction: "asc" },
};

export function UsersAdminPage() {
  usePageTitle("Admin: users");
  const { user: currentUser } = useAuth();
  const [filters, setFilters] = useState<UserFilterForm>(EMPTY_FILTERS);
  const [pending, setPending] = useState<AdminUser | null>(null);
  const [pendingRole, setPendingRole] = useState<{
    entry: AdminUser;
    role: AdminUser["role"];
  } | null>(null);
  const query = useDebouncedValue(filters.query, 350);
  const sorting = SORTS[filters.sort] ?? SORTS.newest;
  const appliedFilters = useMemo(
    () => ({
      query,
      role: filters.role,
      enabled: filters.enabled,
      emailVerified: filters.emailVerified,
      provider: filters.provider,
      sort: filters.sort,
    }),
    [
      query,
      filters.role,
      filters.enabled,
      filters.emailVerified,
      filters.provider,
      filters.sort,
    ],
  );
  const [page, setPage] = useResettingPage(appliedFilters);
  const users = useFetch(
    () =>
      fetchAdminUsers({
        query,
        role: filters.role,
        enabled: filters.enabled,
        emailVerified: filters.emailVerified,
        provider: filters.provider,
        sort: sorting.column,
        direction: sorting.direction,
        page,
      }),
    [
      query,
      filters.role,
      filters.enabled,
      filters.emailVerified,
      filters.provider,
      filters.sort,
      page,
    ],
    { keepPrevious: true },
  );
  const filtered = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  function change(key: keyof UserFilterForm, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }
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
    const { entry: target, role } = pendingRole;
    const promote = role === "ADMIN";
    const changed = await save.run(
      () => setUserRole(target.id, role),
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
      <div className="filters">
        <FormField
          label="Search"
          name="query"
          type="search"
          placeholder="Email or name"
          value={filters.query}
          onChange={(event) => change("query", event.target.value)}
        />
        <SelectField
          label="Role"
          name="role"
          value={filters.role}
          onChange={(event) => change("role", event.target.value)}
        >
          <option value="">Any</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </SelectField>
        <SelectField
          label="Status"
          name="enabled"
          value={filters.enabled}
          onChange={(event) => change("enabled", event.target.value)}
        >
          <option value="">Any</option>
          <option value="true">Active</option>
          <option value="false">Blocked</option>
        </SelectField>
        <SelectField
          label="Email"
          name="emailVerified"
          value={filters.emailVerified}
          onChange={(event) => change("emailVerified", event.target.value)}
        >
          <option value="">Any</option>
          <option value="true">Verified</option>
          <option value="false">Not verified</option>
        </SelectField>
        <SelectField
          label="Sign-in"
          name="provider"
          value={filters.provider}
          onChange={(event) => change("provider", event.target.value)}
        >
          <option value="">Any</option>
          <option value="LOCAL">Local</option>
          <option value="GOOGLE">Google</option>
        </SelectField>
        <SelectField
          label="Sort by"
          name="sort"
          value={filters.sort}
          onChange={(event) => change("sort", event.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="lastLogin">Last sign-in</option>
          <option value="name">Name A–Z</option>
        </SelectField>
        {filtered && (
          <button
            type="button"
            className="button button--ghost"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
            }}
          >
            Reset
          </button>
        )}
      </div>
      <StatusMessage error={save.error} />
      {users.loading && <Spinner label="Loading users" />}
      {users.error && (
        <ErrorMessage failure={users.error} onRetry={users.reload} />
      )}
      {users.data && users.data.content.length === 0 && (
        <EmptyState kind="no-match">No users match this search.</EmptyState>
      )}
      {users.data && users.data.content.length > 0 && (
        <div className="table-wrap">
          <table className="table table--cards">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Sign-in</th>
                <th scope="col">Last sign-in</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.data.content.map((entry) => (
                <tr key={entry.id}>
                  <th scope="row">
                    {entry.displayName}
                    <span className="muted"> {entry.email}</span>
                  </th>
                  <td data-label="Role">
                    {entry.id === currentUser?.id ? (
                      <StatusBadge
                        value={entry.role}
                        tone={entry.role === "ADMIN" ? "warning" : "neutral"}
                      />
                    ) : (
                      <select
                        className={clsx("select-pill", {
                          "select-pill--warning": entry.role === "ADMIN",
                        })}
                        aria-label={`Role of ${entry.email}`}
                        value={entry.role}
                        onChange={(event) =>
                          setPendingRole({
                            entry,
                            role: event.target.value as AdminUser["role"],
                          })
                        }
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    )}
                  </td>
                  <td data-label="Sign-in">{humanize(entry.provider)}</td>
                  <td data-label="Last sign-in">
                    {entry.lastLoginAt
                      ? formatDateTime(entry.lastLoginAt)
                      : "never"}
                  </td>
                  <td data-label="Status">
                    {entry.id === currentUser?.id ? (
                      <StatusBadge value="Active" tone="good" />
                    ) : (
                      <button
                        type="button"
                        className={clsx(
                          "status-badge",
                          "status-badge--action",
                          entry.enabled
                            ? "status-badge--good"
                            : "status-badge--bad",
                        )}
                        title={
                          entry.enabled ? "Click to block" : "Click to unblock"
                        }
                        aria-label={`${entry.enabled ? "Active, block" : "Blocked, unblock"} ${entry.email}`}
                        onClick={() => setPending(entry)}
                      >
                        {entry.enabled ? "Active" : "Blocked"}
                      </button>
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
              ? "Make this user an admin?"
              : "Remove admin rights?"
          }
          message={
            pendingRole.role === "ADMIN"
              ? `${pendingRole.entry.email} will get full access to the admin panel.`
              : `${pendingRole.entry.email} will lose access to the admin panel and will be signed out.`
          }
          confirmLabel={
            pendingRole.role === "ADMIN" ? "Make admin" : "Remove admin"
          }
          busy={save.saving}
          onConfirm={() => void confirmRoleChange()}
          onCancel={() => setPendingRole(null)}
        />
      )}
    </>
  );
}
