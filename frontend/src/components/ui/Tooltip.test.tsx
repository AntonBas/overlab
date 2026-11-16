import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  it("keeps the tip mounted but closed and describes the trigger by it", () => {
    render(
      <Tooltip
        content="Shoots a dart"
        tipClassName="tip"
        openTipClassName="tip--open"
      >
        {({ describedBy }) => (
          <button aria-describedby={describedBy}>Dart</button>
        )}
      </Tooltip>,
    );

    const tip = screen.getByRole("tooltip");
    expect(tip).toHaveTextContent("Shoots a dart");
    expect(tip).not.toHaveClass("tip--open");
    expect(
      screen.getByRole("button", { name: "Dart" }),
    ).toHaveAccessibleDescription("Shoots a dart");
  });

  it("opens on focus and closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip
        content="Shoots a dart"
        tipClassName="tip"
        openTipClassName="tip--open"
      >
        {() => <button>Dart</button>}
      </Tooltip>,
    );

    await user.tab();
    expect(screen.getByRole("tooltip")).toHaveClass("tip--open");

    await user.keyboard("{Escape}");
    expect(screen.getByRole("tooltip")).not.toHaveClass("tip--open");
  });

  it("opens on hover", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip
        content="Shoots a dart"
        tipClassName="tip"
        openTipClassName="tip--open"
      >
        {() => <button>Dart</button>}
      </Tooltip>,
    );

    await user.hover(screen.getByRole("button", { name: "Dart" }));

    expect(screen.getByRole("tooltip")).toHaveClass("tip--open");
  });

  it("mounts the tip only while open when asked to, as a labelled dialog", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip
        mount="open"
        role="dialog"
        label="Ana: note"
        interactive
        content="A note"
        tipClassName="tip"
      >
        {({ describedBy }) => (
          <button aria-describedby={describedBy}>Ana</button>
        )}
      </Tooltip>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ana" })).not.toHaveAttribute(
      "aria-describedby",
    );

    await user.hover(screen.getByRole("button", { name: "Ana" }));

    expect(screen.getByRole("dialog", { name: "Ana: note" })).toHaveTextContent(
      "A note",
    );
    expect(screen.getByRole("button", { name: "Ana" })).toHaveAttribute(
      "aria-describedby",
    );
  });

  it("renders only the trigger when disabled", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip disabled mount="open" content="Hidden" tipClassName="tip">
        {() => <button>Plain</button>}
      </Tooltip>,
    );

    await user.hover(screen.getByRole("button", { name: "Plain" }));

    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });
});
