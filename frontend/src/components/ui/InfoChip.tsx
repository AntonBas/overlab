import clsx from "clsx";
import { useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFloatingTip } from "../../hooks/useFloatingTip";
import "./ui.css";

interface InfoChipProps {
  description?: string;
  children: ReactNode;
}

export function InfoChip({ description, children }: InfoChipProps) {
  const tipId = useId();
  const { open, style, triggerRef, tipRef, triggerProps } = useFloatingTip();

  if (!description) {
    return <span className="info-chip info-chip--plain">{children}</span>;
  }
  return (
    <span className="info-chip" ref={triggerRef} {...triggerProps}>
      <button
        type="button"
        className="info-chip__button"
        aria-describedby={tipId}
      >
        {children}
      </button>
      {createPortal(
        <span
          id={tipId}
          role="tooltip"
          ref={tipRef}
          className={clsx("info-chip__tip", {
            "info-chip__tip--open": open,
          })}
          style={style}
        >
          {description}
        </span>,
        document.body,
      )}
    </span>
  );
}
