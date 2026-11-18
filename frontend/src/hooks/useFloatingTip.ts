import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";

const VIEWPORT_MARGIN = 8;
const DEFAULT_TRIGGER_GAP = 8;
const HIDE_DELAY_MS = 150;
const FOCUSABLE_SELECTOR = "a[href], button:not([disabled])";

function focusableIn(root: HTMLElement | null): HTMLElement[] {
  return root
    ? Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    : [];
}

export function useFloatingTip(
  triggerGap: number = DEFAULT_TRIGGER_GAP,
  interactive: boolean = false,
) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({});

  const hideTimer = useRef<number | undefined>(undefined);
  const touchStartedClosed = useRef<boolean | null>(null);
  const pressedInsideTip = useRef(false);

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

  const onTriggerBlur = useCallback(
    (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;
      if (interactive && next && tipRef.current?.contains(next)) {
        return;
      }
      hide();
    },
    [interactive, hide],
  );

  const onTriggerKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!interactive || !open || event.key !== "Tab" || event.shiftKey) {
        return;
      }
      const [first] = focusableIn(tipRef.current);
      if (first) {
        event.preventDefault();
        first.focus();
      }
    },
    [interactive, open],
  );

  const onTipBlur = useCallback(
    (event: FocusEvent) => {
      if (!interactive) {
        return;
      }
      const next = event.relatedTarget as Node | null;
      if (
        next &&
        (tipRef.current?.contains(next) || triggerRef.current?.contains(next))
      ) {
        return;
      }
      hide();
    },
    [interactive, hide],
  );

  const onTipKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!interactive) {
        return;
      }
      const [triggerTarget] = focusableIn(triggerRef.current);
      if (event.key === "Escape") {
        triggerTarget?.focus();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const items = focusableIn(tipRef.current);
      if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault();
        triggerTarget?.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === items[items.length - 1]
      ) {
        triggerTarget?.focus();
        hide();
      }
    },
    [interactive, hide],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      touchStartedClosed.current = event.pointerType === "mouse" ? null : !open;
    },
    [open],
  );

  const onClickCapture = useCallback(
    (event: MouseEvent) => {
      const firstTouch = touchStartedClosed.current === true;
      touchStartedClosed.current = null;
      if (firstTouch) {
        event.preventDefault();
        show();
      }
    },
    [show],
  );

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
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    function onOutsidePointerDown(event: globalThis.PointerEvent) {
      if (pressedInsideTip.current) {
        pressedInsideTip.current = false;
        return;
      }
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !tipRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onOutsidePointerDown);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onOutsidePointerDown);
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
      onBlur: onTriggerBlur,
      onKeyDown: onTriggerKeyDown,
      onPointerDown,
      onClickCapture,
    },
    tipProps: {
      onPointerDownCapture: () => {
        pressedInsideTip.current = true;
      },
      onMouseEnter: show,
      onMouseLeave: hideSoon,
      onBlur: onTipBlur,
      onKeyDown: onTipKeyDown,
    },
  };
}
