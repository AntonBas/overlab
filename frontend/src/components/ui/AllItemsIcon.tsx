import "./ui.css";
const ALL_ITEMS_ICON = "url(/images/roles/flex.svg)";

export function AllItemsIcon() {
  return (
    <span
      className="all-roles-icon"
      aria-hidden="true"
      style={{ maskImage: ALL_ITEMS_ICON, WebkitMaskImage: ALL_ITEMS_ICON }}
    />
  );
}
