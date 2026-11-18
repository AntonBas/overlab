import clsx from "clsx";
import { Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

export function RowActions({ children }: { children: ReactNode }) {
  return <div className="row-actions">{children}</div>;
}

interface RowActionProps {
  kind: "edit" | "delete";
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function RowAction({
  kind,
  label,
  onClick,
  disabled = false,
}: RowActionProps) {
  const Icon = kind === "edit" ? Pencil : Trash2;
  return (
    <button
      type="button"
      className={clsx("icon-button", "row-action", {
        "row-action--danger": kind === "delete",
      })}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}
