import { AllItemsIcon } from "./AllItemsIcon";
import "./ui.css";

export function AllRolesBadge({ label }: { label: string }) {
  return (
    <span className="role-badge">
      <AllItemsIcon />
      {label}
    </span>
  );
}
