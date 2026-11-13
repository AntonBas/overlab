export interface RelationNoteParts {
  reason: string | null;
  limits: string | null;
}

const REASON_PREFIX = /^Why it works:\s*/i;
const LIMITS_SEPARATOR = /\s*Limits:\s*/i;

export function splitRelationNote(note: string): RelationNoteParts {
  const [reasonPart, ...limitParts] = note.split(LIMITS_SEPARATOR);
  const reason = reasonPart.replace(REASON_PREFIX, "").trim();
  const limits = limitParts.join(" ").trim();
  return {
    reason: reason === "" ? null : reason,
    limits: limits === "" ? null : limits,
  };
}
