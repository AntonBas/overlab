import clsx from "clsx";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import "./ui.css";

interface FiltersPanelProps {
  children: ReactNode;
}

export function FiltersPanel({ children }: FiltersPanelProps) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  return (
    <div className={clsx("filters-panel", { "filters-panel--open": open })}>
      <button
        type="button"
        className="button button--ghost filters-panel__toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((current) => !current)}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        Filters
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="filters-panel__chevron"
        />
      </button>
      <div id={bodyId} className="filters-panel__body">
        {children}
      </div>
    </div>
  );
}
