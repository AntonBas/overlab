const ALL_ROLES_ICON = "url(/images/roles/flex.svg)";

export function AllRolesBadge({ label }: { label: string }) {
  return (
    <span className="role-badge">
      <span
        className="all-roles-icon"
        aria-hidden="true"
        style={{ maskImage: ALL_ROLES_ICON, WebkitMaskImage: ALL_ROLES_ICON }}
      />
      {label}
    </span>
  );
}
