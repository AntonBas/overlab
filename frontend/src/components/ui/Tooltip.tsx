import clsx from "clsx";
import { useId, type HTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFloatingTip } from "../../hooks/useFloatingTip";

interface TooltipTrigger {
  describedBy: string | undefined;
  open: boolean;
}

interface TooltipProps {
  content: ReactNode;
  children: (trigger: TooltipTrigger) => ReactNode;
  tipClassName: string;
  openTipClassName?: string;
  triggerClassName?: string;
  triggerProps?: HTMLAttributes<HTMLSpanElement>;
  describeTrigger?: boolean;
  role?: "tooltip" | "dialog";
  label?: string;
  interactive?: boolean;
  gap?: number;
  mount?: "always" | "open";
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  tipClassName,
  openTipClassName,
  triggerClassName,
  triggerProps,
  describeTrigger = false,
  role = "tooltip",
  label,
  interactive = false,
  gap,
  mount = "always",
  disabled = false,
}: TooltipProps) {
  const tipId = useId();
  const {
    open,
    style,
    triggerRef,
    tipRef,
    triggerProps: floatingTriggerProps,
    tipProps,
  } = useFloatingTip(gap, interactive);
  const mounted = !disabled && (mount === "always" || open);
  const describedBy = mounted ? tipId : undefined;

  return (
    <>
      <span
        ref={triggerRef}
        className={triggerClassName}
        aria-describedby={describeTrigger ? describedBy : undefined}
        {...(disabled ? {} : floatingTriggerProps)}
        {...triggerProps}
      >
        {children({ describedBy, open })}
      </span>
      {mounted &&
        createPortal(
          <span
            id={tipId}
            role={role}
            aria-label={label}
            ref={tipRef}
            className={clsx(
              tipClassName,
              openTipClassName && {
                [openTipClassName]: open,
              },
            )}
            style={style}
            {...tipProps}
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  );
}
