import { useEffect, useId, useRef } from "react";

function keepFocusInside(event: KeyboardEvent, dialog: HTMLElement | null) {
  const focusable = Array.from(
    dialog?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? [],
  );
  if (focusable.length === 0) {
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!dialog?.contains(document.activeElement)) {
    event.preventDefault();
    first.focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const latestCancel = useRef(onCancel);

  useEffect(() => {
    latestCancel.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    cancelRef.current?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        latestCancel.current();
      } else if (event.key === "Tab") {
        keepFocusInside(event, dialogRef.current);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  return (
    <div className="dialog__backdrop">
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId}>{title}</h2>
        <p>{message}</p>
        <div className="dialog__actions">
          <button
            ref={cancelRef}
            type="button"
            className="button button--ghost"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button--danger"
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
