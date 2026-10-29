import { useId, type ReactNode } from "react";

interface InfoChipProps {
  description?: string;
  children: ReactNode;
}

export function InfoChip({ description, children }: InfoChipProps) {
  const tipId = useId();

  if (!description) {
    return <span className="info-chip info-chip--plain">{children}</span>;
  }
  return (
    <span className="info-chip">
      <button
        type="button"
        className="info-chip__button"
        aria-describedby={tipId}
      >
        {children}
      </button>
      <span id={tipId} role="tooltip" className="info-chip__tip">
        {description}
      </span>
    </span>
  );
}
