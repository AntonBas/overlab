import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("focuses Cancel once and keeps the focus where the user moved it when the parent renders again", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ConfirmDialog
        title="Delete hero"
        message="Sure?"
        onConfirm={vi.fn()}
        onCancel={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();

    rerender(
      <ConfirmDialog
        title="Delete hero"
        message="Sure?"
        onConfirm={vi.fn()}
        onCancel={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();
  });

  it("keeps Tab and Shift+Tab inside the dialog", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        title="Delete hero"
        message="Sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();
  });

  it("cancels with Escape and has no accessibility violations", async () => {
    const onCancel = vi.fn();
    const { container } = render(
      <ConfirmDialog
        title="Delete hero"
        message="Sure?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await userEvent.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });
});
