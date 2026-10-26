import type {
  Hero,
  MapMode,
  PerkRecommendation,
  PerkSlot,
} from "../../types/api";

export interface AdminHero extends Hero {
  active: boolean;
}

export type RelationType = "COUNTER" | "SYNERGY";

export interface HeroRelation {
  id: number;
  heroSlug: string;
  relatedHeroSlug: string;
  type: RelationType;
  strength: number;
  note: string | null;
}

export interface RelationPayload {
  heroSlug: string;
  relatedHeroSlug: string;
  type: RelationType;
  strength: number;
  note: string | null;
}

export interface PerkPayload {
  heroSlug: string;
  name: string;
  description: string | null;
  slot: PerkSlot;
  recommendation: PerkRecommendation;
  recommendationNote: string | null;
}

export interface GuidePayload {
  heroSlug: string;
  mapSlug: string | null;
  title: string;
  slug: string | null;
  youtubeId: string;
  startSeconds: number;
  description: string | null;
  sortOrder: number;
  published: boolean;
}

export interface PatchPayload {
  version: string;
  slug: string | null;
  title: string | null;
  releasedAt: string;
  notes: string | null;
}

export interface MapPayload {
  mode: MapMode | null;
  imageUrl: string | null;
}

export type CollectorRunStatus = "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";
export type CollectorTrigger = "SCHEDULED" | "MANUAL" | "STARTUP";

export interface CollectorJob {
  name: string;
  cron: string;
  enabled: boolean;
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

export interface AuditFilters {
  entityType?: string;
  actorId?: string;
  action?: string;
  from?: string;
  to?: string;
  page: number;
}
