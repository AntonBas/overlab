import type {
  AuditEntry,
  CollectorJob,
  CollectorRun,
  PageResponse,
} from "../../features/admin/types";
import type { FeedbackMessage } from "../../features/feedback/admin/types";
import type { HeroRelation } from "../../features/relations/admin/types";
import type { Patch } from "../../types/patch";

export function collectorJob(
  overrides: Partial<CollectorJob> = {},
): CollectorJob {
  return {
    name: "statsCollector",
    cron: "0 0 * * * *",
    enabled: true,
    after: null,
    minInterval: null,
    ...overrides,
  };
}

export function collectorRun(
  overrides: Partial<CollectorRun> = {},
): CollectorRun {
  return {
    id: 1,
    jobName: "statsCollector",
    trigger: "SCHEDULED",
    status: "SUCCESS",
    startedAt: "2026-01-01T10:00:00Z",
    finishedAt: "2026-01-01T10:01:05Z",
    requestsTotal: 10,
    requestsFailed: 2,
    rowsSaved: 40,
    errorSummary: null,
    ...overrides,
  };
}

export function auditEntry(overrides: Partial<AuditEntry> = {}): AuditEntry {
  return {
    id: 1,
    occurredAt: "2026-01-01T10:00:00Z",
    actorId: 7,
    actorName: "Ana Admin",
    actorRole: "ADMIN",
    action: "DELETE",
    entityType: "Guide",
    entityId: "12",
    changes: null,
    ipAddress: null,
    ...overrides,
  };
}

export function pageOf<T>(content: T[]): PageResponse<T> {
  return {
    content,
    page: 0,
    size: 20,
    totalElements: content.length,
    totalPages: 1,
  };
}

export function feedbackMessage(
  overrides: Partial<FeedbackMessage> = {},
): FeedbackMessage {
  return {
    id: 5,
    type: "BUG",
    message: "Chart is broken",
    pagePath: "/stats",
    authorName: null,
    contactEmail: "visitor@example.com",
    status: "NEW",
    createdAt: "2026-01-01T10:00:00Z",
    resolvedAt: null,
    ...overrides,
  };
}

export function heroRelation(
  overrides: Partial<HeroRelation> = {},
): HeroRelation {
  return {
    id: 9,
    heroSlug: "ana",
    relatedHeroSlug: "reaper",
    type: "COUNTER",
    note: null,
    ...overrides,
  };
}

export function patch(overrides: Partial<Patch> = {}): Patch {
  return {
    id: 3,
    version: "2.10",
    slug: "2-10",
    title: "Big balance",
    season: null,
    releasedAt: "2026-01-01T10:00:00Z",
    notes: null,
    ...overrides,
  };
}
