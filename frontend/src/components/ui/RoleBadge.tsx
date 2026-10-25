import clsx from "clsx";
import type { HeroRole } from "../../types/api";
import { ROLE_LABELS } from "../../utils/format";

interface RoleBadgeProps {
  role: HeroRole;
  compact?: boolean;
}

export function RoleBadge({ role, compact = false }: RoleBadgeProps) {
  return (
    <span className={clsx("role-badge", `role-badge--${role.toLowerCase()}`)}>
      <span className="role-badge__dot" aria-hidden="true" />
      {!compact && ROLE_LABELS[role]}
      {compact && <span className="visually-hidden">{ROLE_LABELS[role]}</span>}
    </span>
  );
}
