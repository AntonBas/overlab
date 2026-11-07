import { AllItemsIcon } from "./AllItemsIcon";

export function AllRolesBadge({ label }: { label: string }) {
  return (
    <span className="role-badge">
      <AllItemsIcon />
      {label}
    </span>
  );
}
