import type {
  GuideKind,
  GuideSide,
  AbilityControl,
  Hero,
  MapMode,
  PerkPosition,
  PerkRecommendation,
  PerkSlot,
} from "../../types/api";

export interface AdminHero extends Hero {
  active: boolean;
}

export interface AdminAbility {
  id: number;
  heroSlug: string;
  name: string;
  iconUrl: string | null;
  control: AbilityControl | null;
}

export type RelationType = "COUNTER" | "SYNERGY";

export type RelationReportStatus = "NEW" | "ACCEPTED" | "REJECTED";

export interface RelationReport {
  id: number;
  relationId: number;
  heroSlug: string;
  relatedHeroSlug: string;
  type: RelationType;
  relationNote: string | null;
  message: string;
  reporterName: string;
  status: RelationReportStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export interface RelationVoteSummary {
  relationId: number;
  heroSlug: string;
  relatedHeroSlug: string;
  type: RelationType;
  up: number;
  down: number;
}

export interface HeroRelation {
  id: number;
  heroSlug: string;
  relatedHeroSlug: string;
  type: RelationType;
  note: string | null;
}

export interface RelationPayload {
  heroSlug: string;
  relatedHeroSlug: string;
  type: RelationType;
  note: string | null;
}

export type CategoryMatchupType =
  "STRONG_AGAINST" | "WEAK_AGAINST" | "WORKS_WITH";

export interface AdminCategory {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  heroSlugs: string[];
}

export interface CategoryPayload {
  slug: string;
  name: string;
  description: string | null;
  heroSlugs: string[];
}

export interface AdminCategoryMatchup {
  id: number;
  heroSlug: string;
  categorySlug: string;
  type: CategoryMatchupType;
  note: string | null;
}

export interface CategoryMatchupPayload {
  heroSlug: string;
  categorySlug: string;
  type: CategoryMatchupType;
  note: string | null;
}

export interface PerkPayload {
  heroSlug: string;
  name: string;
  description: string | null;
  slot: PerkSlot;
  position: PerkPosition;
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
  endSeconds: number | null;
  kind: GuideKind;
  side: GuideSide;
  abilitySlug: string | null;
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
}

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

export interface AuditFilters {
  entityType?: string;
  actorId?: string;
  action?: string;
  from?: string;
  to?: string;
  page: number;
}
