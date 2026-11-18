import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Drawer } from "./Drawer";
import { UnsavedChangesContext } from "./unsavedChanges";

function renderDrawer(dirty = false) {
  const onClose = vi.fn();
  render(
    <UnsavedChangesContext.Provider
      value={{ setDirty: vi.fn(), isDirty: () => dirty, dirty }}
    >
      <Drawer label="Edit hero" onClose={onClose}>
        <form>
          <input aria-label="Name" />
          <button type="button">Save</button>
        </form>
      </Drawer>
    </UnsavedChangesContext.Provider>,
  );
  return onClose;
}

describe("Drawer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is a labelled dialog and focuses the first field", () => {
    renderDrawer();

    expect(screen.getByRole("dialog", { name: "Edit hero" })).toBeVisible();
    expect(screen.getByLabelText("Name")).toHaveFocus();
  });

  it("says when there are unsaved changes", () => {
    renderDrawer(true);

    expect(screen.getByRole("status")).toHaveTextContent("Unsaved changes");
  });

  it("shows no unsaved marker for a clean form", () => {
    renderDrawer(false);

    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
  });

  it("closes with the close button, Escape and a click outside", async () => {
    const onClose = renderDrawer();

    await userEvent.click(screen.getByRole("button", { name: "Close panel" }));
    await userEvent.keyboard("{Escape}");
    fireEvent.mouseDown(document.querySelector(".drawer__backdrop")!);

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("does not close when the click lands inside the panel", () => {
    const onClose = renderDrawer();

    fireEvent.mouseDown(screen.getByLabelText("Name"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("asks before closing with unsaved changes", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const onClose = renderDrawer(true);

    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps Tab inside the panel", async () => {
    renderDrawer();
    const user = userEvent.setup();

    await user.tab();
    await user.tab();
    await user.tab();

    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(
      true,
    );
  });

  it("locks page scrolling while open and unlocks on close", () => {
    const { unmount } = render(
      <Drawer label="x" onClose={vi.fn()}>
        <p>content</p>
      </Drawer>,
    );
    expect(document.body).toHaveClass("drawer-open");

    unmount();

    expect(document.body).not.toHaveClass("drawer-open");
  });
});
