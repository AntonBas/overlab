import { api } from "../../../services/api";
import type { GameMap, Guide, Patch, Perk } from "../../../types/api";
import type {
  AdminHero,
  AdminUser,
  AuditEntry,
  AuditFilters,
  CollectorJob,
  CollectorRun,
  GuidePayload,
  HeroRelation,
  MapPayload,
  PageResponse,
  PatchPayload,
  PerkPayload,
  RelationPayload,
} from "../types";

export async function fetchAdminHeroes(): Promise<AdminHero[]> {
  const { data } = await api.get<AdminHero[]>("/admin/heroes");
  return data;
}

export async function updateHero(
  slug: string,
  payload: { description: string | null; active: boolean },
): Promise<AdminHero> {
  const { data } = await api.put<AdminHero>(`/admin/heroes/${slug}`, payload);
  return data;
}

export async function fetchPerks(heroSlug: string): Promise<Perk[]> {
  const { data } = await api.get<Perk[]>(`/heroes/${heroSlug}/perks`);
  return data;
}

export async function createPerk(payload: PerkPayload): Promise<Perk> {
  const { data } = await api.post<Perk>("/admin/perks", payload);
  return data;
}

export async function updatePerk(
  id: number,
  payload: PerkPayload,
): Promise<Perk> {
  const { data } = await api.put<Perk>(`/admin/perks/${id}`, payload);
  return data;
}

export async function deletePerk(id: number): Promise<void> {
  await api.delete(`/admin/perks/${id}`);
}

export async function fetchRelations(
  heroSlug?: string,
): Promise<HeroRelation[]> {
  const { data } = await api.get<HeroRelation[]>("/admin/hero-relations", {
    params: heroSlug ? { hero: heroSlug } : undefined,
  });
  return data;
}

export async function createRelation(
  payload: RelationPayload,
): Promise<HeroRelation> {
  const { data } = await api.post<HeroRelation>(
    "/admin/hero-relations",
    payload,
  );
  return data;
}

export async function updateRelation(
  id: number,
  payload: RelationPayload,
): Promise<HeroRelation> {
  const { data } = await api.put<HeroRelation>(
    `/admin/hero-relations/${id}`,
    payload,
  );
  return data;
}

export async function deleteRelation(id: number): Promise<void> {
  await api.delete(`/admin/hero-relations/${id}`);
}

export async function fetchAdminGuides(): Promise<Guide[]> {
  const { data } = await api.get<Guide[]>("/admin/guides");
  return data;
}

export async function createGuide(payload: GuidePayload): Promise<Guide> {
  const { data } = await api.post<Guide>("/admin/guides", payload);
  return data;
}

export async function updateGuide(
  id: number,
  payload: GuidePayload,
): Promise<Guide> {
  const { data } = await api.put<Guide>(`/admin/guides/${id}`, payload);
  return data;
}

export async function deleteGuide(id: number): Promise<void> {
  await api.delete(`/admin/guides/${id}`);
}

export async function fetchPatches(): Promise<Patch[]> {
  const { data } = await api.get<Patch[]>("/patches");
  return data;
}

export async function createPatch(payload: PatchPayload): Promise<Patch> {
  const { data } = await api.post<Patch>("/admin/patches", payload);
  return data;
}

export async function updatePatch(
  id: number,
  payload: PatchPayload,
): Promise<Patch> {
  const { data } = await api.put<Patch>(`/admin/patches/${id}`, payload);
  return data;
}

export async function deletePatch(id: number): Promise<void> {
  await api.delete(`/admin/patches/${id}`);
}

export async function updateMap(
  slug: string,
  payload: MapPayload,
): Promise<GameMap> {
  const { data } = await api.put<GameMap>(`/admin/maps/${slug}`, payload);
  return data;
}

function imageForm(file: File): FormData {
  const form = new FormData();
  form.append("file", file);
  return form;
}

export async function uploadMapImage(
  slug: string,
  file: File,
): Promise<GameMap> {
  const { data } = await api.put<GameMap>(
    `/admin/maps/${slug}/image`,
    imageForm(file),
  );
  return data;
}

export async function removeMapImage(slug: string): Promise<GameMap> {
  const { data } = await api.delete<GameMap>(`/admin/maps/${slug}/image`);
  return data;
}

export async function uploadPerkIcon(id: number, file: File): Promise<Perk> {
  const { data } = await api.put<Perk>(
    `/admin/perks/${id}/icon`,
    imageForm(file),
  );
  return data;
}

export async function removePerkIcon(id: number): Promise<Perk> {
  const { data } = await api.delete<Perk>(`/admin/perks/${id}/icon`);
  return data;
}

export async function importPerks(): Promise<{ heroes: number }> {
  const { data } = await api.post<{ heroes: number }>(
    "/admin/collector/perks/import",
  );
  return data;
}

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
  query: string,
  page: number,
): Promise<PageResponse<AdminUser>> {
  const { data } = await api.get<PageResponse<AdminUser>>("/admin/users", {
    params: { q: query || undefined, page, size: 25 },
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
