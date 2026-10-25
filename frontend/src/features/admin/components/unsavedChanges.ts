import { createContext, useContext, useEffect } from "react";

export interface UnsavedChangesValue {
  setDirty: (dirty: boolean) => void;
}

export const UnsavedChangesContext = createContext<UnsavedChangesValue | null>(
  null,
);

export function useUnsavedChanges(dirty: boolean) {
  const context = useContext(UnsavedChangesContext);
  const setDirty = context?.setDirty;

  useEffect(() => {
    setDirty?.(dirty);
    if (!dirty) {
      return undefined;
    }
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      setDirty?.(false);
    };
  }, [dirty, setDirty]);
}
