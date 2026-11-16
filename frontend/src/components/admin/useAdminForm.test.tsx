import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../toast/ToastProvider";
import { UnsavedChangesContext } from "./unsavedChanges";
import { useAdminForm } from "./useAdminForm";

function setup(extraDirty = false) {
  const setDirty = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ToastProvider>
      <UnsavedChangesContext.Provider
        value={{ setDirty, isDirty: () => false }}
      >
        {children}
      </UnsavedChangesContext.Provider>
    </ToastProvider>
  );
  const view = renderHook(
    () => useAdminForm({ name: "Ana", active: true }, extraDirty),
    { wrapper },
  );
  return { ...view, setDirty };
}

describe("useAdminForm", () => {
  it("starts clean and tracks changed values", () => {
    const { result, setDirty } = setup();
    expect(result.current.dirty).toBe(false);

    act(() => result.current.change("name", "Bastion"));

    expect(result.current.values).toEqual({ name: "Bastion", active: true });
    expect(result.current.dirty).toBe(true);
    expect(setDirty).toHaveBeenLastCalledWith(true);
  });

  it("is clean again when the value returns to the initial one", () => {
    const { result } = setup();
    act(() => result.current.change("active", false));
    act(() => result.current.change("active", true));
    expect(result.current.dirty).toBe(false);
  });

  it("counts extra changes outside the values as dirty", () => {
    const { result } = setup(true);
    expect(result.current.dirty).toBe(true);
  });

  it("stops warning about unsaved changes after a successful save", async () => {
    const { result, setDirty } = setup();
    act(() => result.current.change("name", "Bastion"));

    await act(async () => {
      await result.current.save.run(() => Promise.resolve(), "Saved.");
    });

    expect(setDirty).toHaveBeenLastCalledWith(false);
  });
});
