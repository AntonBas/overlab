import { api } from "../../../services/api";
import type {
  AdminUser,
  AuditEntry,
  AuditFilters,
  CollectorJob,
  CollectorRun,
  PageResponse,
  UserFilters,
} from "../types";

export async function fetchCollectorJobs(): Promise<CollectorJob[]> {
  const { data } = await api.get<CollectorJob[]>("/admin/collector/jobs");
  return data;
}

export async function fetchCollectorRuns(): Promise<CollectorRun[]> {
  const { data } = await api.get<CollectorRun[]>("/admin/collector/runs");
  return data;
}

export async function runCollectorJob(name: string): Promise<CollectorRun> {
  const { data } = await api.post<CollectorRun>(
    `/admin/collector/jobs/${name}/run`,
  );
  return data;
}

export async function fetchAuditLog(
  filters: AuditFilters,
): Promise<PageResponse<AuditEntry>> {
  const { data } = await api.get<PageResponse<AuditEntry>>("/admin/audit", {
    params: {
      entityType: filters.entityType || undefined,
      actorId: filters.actorId || undefined,
      action: filters.action || undefined,
      from: filters.from ? new Date(filters.from).toISOString() : undefined,
      to: filters.to ? new Date(filters.to).toISOString() : undefined,
      page: filters.page,
      size: 25,
    },
  });
  return data;
}

export async function fetchAdminUsers(
  filters: UserFilters,
): Promise<PageResponse<AdminUser>> {
  const { data } = await api.get<PageResponse<AdminUser>>("/admin/users", {
    params: {
      q: filters.query || undefined,
      role: filters.role || undefined,
      enabled: filters.enabled || undefined,
      emailVerified: filters.emailVerified || undefined,
      provider: filters.provider || undefined,
      sort: filters.sort,
      direction: filters.direction,
      page: filters.page,
      size: 25,
    },
  });
  return data;
}

export async function setUserEnabled(
  id: number,
  enabled: boolean,
): Promise<AdminUser> {
  const { data } = await api.put<AdminUser>(`/admin/users/${id}/enabled`, {
    enabled,
  });
  return data;
}

export async function setUserRole(
  id: number,
  role: AdminUser["role"],
): Promise<AdminUser> {
  const { data } = await api.put<AdminUser>(`/admin/users/${id}/role`, {
    role,
  });
  return data;
}
