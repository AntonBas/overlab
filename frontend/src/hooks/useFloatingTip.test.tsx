import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useFloatingTip } from "./useFloatingTip";

const followed = vi.fn();

function Example() {
  const { open, triggerRef, tipRef, triggerProps, tipProps } = useFloatingTip();
  return (
    <div>
      <span ref={triggerRef} {...triggerProps}>
        <a
          href="#hero"
          onClick={(event) => {
            if (!event.defaultPrevented) {
              followed();
            }
            event.preventDefault();
          }}
        >
          Ana
        </a>
      </span>
      {open && (
        <span ref={tipRef} role="tooltip" {...tipProps}>
          <button type="button">Agree</button>
        </span>
      )}
      <p>elsewhere</p>
    </div>
  );
}

describe("useFloatingTip", () => {
  it("opens on hover and follows the link on click with a mouse", async () => {
    followed.mockClear();
    render(<Example />);

    await userEvent.hover(screen.getByRole("link", { name: "Ana" }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "Ana" }));

    expect(followed).toHaveBeenCalledTimes(1);
  });

  it("opens on the first tap and follows the link on the second", async () => {
    followed.mockClear();
    render(<Example />);
    const link = screen.getByRole("link", { name: "Ana" });

    await userEvent.pointer({ keys: "[TouchA]", target: link });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(followed).not.toHaveBeenCalled();

    await userEvent.pointer({ keys: "[TouchA]", target: link });
    expect(followed).toHaveBeenCalledTimes(1);
  });

  it("closes when tapping outside but not inside the tooltip", async () => {
    render(<Example />);
    const link = screen.getByRole("link", { name: "Ana" });
    await userEvent.pointer({ keys: "[TouchA]", target: link });

    fireEvent.pointerDown(screen.getByRole("button", { name: "Agree" }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByText("elsewhere"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    render(<Example />);
    await userEvent.hover(screen.getByRole("link", { name: "Ana" }));

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
