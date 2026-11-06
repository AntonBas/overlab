import { formatDateTime, humanize } from "../../../utils/format";

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const ENUM_VALUE = /^[A-Z][A-Z_]+$/;

export function splitWords(identifier: string): string {
  const spaced = identifier
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function describeActor(
  actorId: number | null,
  actorRole: string | null,
): string {
  if (actorId === null) {
    return "System";
  }
  return actorRole
    ? `User #${actorId} (${humanize(actorRole)})`
    : `User #${actorId}`;
}

export function describeEntity(
  entityType: string,
  entityId: string | null,
): string {
  const name = splitWords(entityType);
  return entityId ? `${name} #${entityId}` : name;
}

export function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "empty";
  }
  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }
  if (typeof value === "string") {
    if (ISO_DATE_TIME.test(value)) {
      return formatDateTime(value);
    }
    return ENUM_VALUE.test(value) ? humanize(value) : value;
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}
