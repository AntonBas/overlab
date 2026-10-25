import clsx from "clsx";
import type { HeroRole } from "../../types/api";
import { ROLE_LABELS } from "../../utils/format";

interface RoleBadgeProps {
  role: HeroRole;
  compact?: boolean;
}

function RoleIcon({ role }: { role: HeroRole }) {
  return (
    <svg
      className="role-badge__icon"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      {role === "TANK" && (
        <path d="M8 1.5 13.5 3.5v4.2c0 3-2.2 5.6-5.5 6.8C4.7 13.3 2.5 10.7 2.5 7.7V3.5z" />
      )}
      {role === "DAMAGE" && <path d="M8 1.5 14 13.5H2z" />}
      {role === "SUPPORT" && (
        <path d="M6.5 2h3v4.5H14v3H9.5V14h-3V9.5H2v-3h4.5z" />
      )}
    </svg>
  );
}

export function RoleBadge({ role, compact = false }: RoleBadgeProps) {
  return (
    <span className={clsx("role-badge", `role-badge--${role.toLowerCase()}`)}>
      <RoleIcon role={role} />
      {!compact && ROLE_LABELS[role]}
      {compact && <span className="visually-hidden">{ROLE_LABELS[role]}</span>}
    </span>
  );
}
