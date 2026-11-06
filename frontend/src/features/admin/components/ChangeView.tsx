import type { AuditAction } from "../types";
import { formatAuditValue, splitWords } from "../utils/audit";

function isTransition(value: unknown): value is { from: unknown; to: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    "from" in value &&
    "to" in value
  );
}

interface ChangeViewProps {
  action: AuditAction;
  changes: Record<string, unknown> | null;
}

export function ChangeView({ action, changes }: ChangeViewProps) {
  if (!changes || Object.keys(changes).length === 0) {
    return null;
  }
  return (
    <ul className="changes">
      {Object.entries(changes).map(([field, value]) => (
        <li key={field}>
          <strong>{splitWords(field)}</strong>:{" "}
          {action === "UPDATE" && isTransition(value) ? (
            <>
              <del>{formatAuditValue(value.from)}</del> &rarr;{" "}
              <ins>{formatAuditValue(value.to)}</ins>
            </>
          ) : (
            <span>{formatAuditValue(value)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
