import type { ReactNode } from "react";
import { Tooltip } from "./Tooltip";

interface InfoChipProps {
  description?: string;
  children: ReactNode;
}

export function InfoChip({ description, children }: InfoChipProps) {
  if (!description) {
    return <span className="info-chip info-chip--plain">{children}</span>;
  }
  return (
    <Tooltip
      content={description}
      triggerClassName="info-chip"
      tipClassName="info-chip__tip"
      openTipClassName="info-chip__tip--open"
    >
      {({ describedBy }) => (
        <button
          type="button"
          className="info-chip__button"
          aria-describedby={describedBy}
        >
          {children}
        </button>
      )}
    </Tooltip>
  );
}
