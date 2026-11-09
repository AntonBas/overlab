import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { LEAVE_WARNING } from "../adminSections";
import { UnsavedChangesContext } from "../forms/unsavedChanges";

interface DrawerProps {
  label: string;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])";
const FIRST_FIELD =
  "input:not([type=file]):not([disabled]), select:not([disabled]), textarea:not([disabled])";

export function Drawer({ label, onClose, children }: DrawerProps) {
  const panel = useRef<HTMLElement>(null);
  const unsaved = useContext(UnsavedChangesContext);

  const requestClose = useCallback(() => {
    if (unsaved?.isDirty() && !window.confirm(LEAVE_WARNING)) {
      return;
    }
    onClose();
  }, [unsaved, onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const target =
      panel.current?.querySelector<HTMLElement>(FIRST_FIELD) ?? panel.current;
    target?.focus();
    document.body.classList.add("drawer-open");
    return () => {
      document.body.classList.remove("drawer-open");
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !document.querySelector(".dialog__backdrop")
      ) {
        requestClose();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [requestClose]);

  function keepFocusInside(event: ReactKeyboardEvent) {
    if (event.key !== "Tab" || !panel.current) {
      return;
    }
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (items.length === 0) {
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="drawer__backdrop" onMouseDown={requestClose}>
      <aside
        ref={panel}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={keepFocusInside}
      >
        <button
          type="button"
          className="drawer__close"
          aria-label="Close panel"
          onClick={requestClose}
        >
          <X aria-hidden="true" size={18} />
        </button>
        {children}
      </aside>
    </div>
  );
}
