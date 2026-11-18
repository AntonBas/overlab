import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RowAction, RowActions } from "./RowActions";

describe("RowActions", () => {
  it("offers edit and delete as labelled icon buttons", async () => {
    const edit = vi.fn();
    const remove = vi.fn();
    render(
      <RowActions>
        <RowAction kind="edit" label="Edit Ana" onClick={edit} />
        <RowAction kind="delete" label="Delete Ana" onClick={remove} />
      </RowActions>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Edit Ana" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete Ana" }));

    expect(edit).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Delete Ana" })).toHaveClass(
      "row-action--danger",
    );
  });
});
