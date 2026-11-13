export type CollectorRunStatus = "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";

export type CollectorTrigger =
  "SCHEDULED" | "MANUAL" | "STARTUP" | "PATCH" | "CHAINED";

export interface CollectorJob {
  name: string;
  cron: string | null;
  enabled: boolean;
  after: string | null;
  minInterval: string | null;
}

export interface CollectorRun {
  id: number;
  jobName: string;
  trigger: CollectorTrigger;
  status: CollectorRunStatus;
  startedAt: string;
  finishedAt: string | null;
  requestsTotal: number;
  requestsFailed: number;
  rowsSaved: number;
  errorSummary: string | null;
}

export type AuditAction =
  "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "PASSWORD_CHANGE";

export interface AuditEntry {
  id: number;
  occurredAt: string;
  actorId: number | null;
  actorRole: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminUser {
  id: number;
  email: string;
  displayName: string;
  role: "USER" | "ADMIN";
  provider: "LOCAL" | "GOOGLE";
  emailVerified: boolean;
  enabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UserFilters {
  query: string;
  role: string;
  enabled: string;
  emailVerified: string;
  provider: string;
  sort: string;
  direction: "asc" | "desc";
  page: number;
}

export interface AuditFilters {
  entityType?: string;
  actorId?: string;
  action?: string;
  from?: string;
  to?: string;
  page: number;
}
