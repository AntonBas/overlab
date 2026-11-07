import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

const VIEWPORT_MARGIN = 8;
const DEFAULT_TRIGGER_GAP = 8;
const HIDE_DELAY_MS = 150;

export function useFloatingTip(triggerGap: number = DEFAULT_TRIGGER_GAP) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({});

  const hideTimer = useRef<number | undefined>(undefined);

  const show = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    setOpen(true);
  }, []);
  const hide = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    setOpen(false);
  }, []);
  const hideSoon = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setOpen(false), HIDE_DELAY_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const tip = tipRef.current;
    if (!open || !trigger || !tip) {
      return;
    }
    const alignTarget = trigger.closest<HTMLElement>("[data-tip-anchor]");
    const anchor = (alignTarget ?? trigger).getBoundingClientRect();
    const tipBox = tip.getBoundingClientRect();
    const tipWidth = alignTarget
      ? Math.max(tipBox.width, anchor.width)
      : tipBox.width;
    const fitsBelow =
      anchor.bottom + triggerGap + tipBox.height <=
      window.innerHeight - VIEWPORT_MARGIN;
    const top = fitsBelow
      ? anchor.bottom + triggerGap
      : Math.max(VIEWPORT_MARGIN, anchor.top - triggerGap - tipBox.height);
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, anchor.left),
      window.innerWidth - tipWidth - VIEWPORT_MARGIN,
    );
    setStyle({
      top,
      left: Math.max(VIEWPORT_MARGIN, left),
      minWidth: alignTarget ? anchor.width : undefined,
    });
  }, [open, triggerGap]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, hide]);

  return {
    open,
    style,
    triggerRef,
    tipRef,
    triggerProps: {
      onMouseEnter: show,
      onMouseLeave: hideSoon,
      onFocus: show,
      onBlur: hide,
    },
    tipProps: {
      onMouseEnter: show,
      onMouseLeave: hideSoon,
    },
  };
}
