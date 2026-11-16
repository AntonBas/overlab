import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RevealMore } from "./RevealMore";

describe("RevealMore", () => {
  it("offers the rest and asks for more on click", async () => {
    const onMore = vi.fn();
    render(
      <RevealMore remaining={20} shown={12} noun="heroes" onMore={onMore} />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Show more heroes (20 left)" }),
    );

    expect(onMore).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when everything is shown", () => {
    const { container } = render(
      <RevealMore remaining={0} shown={12} noun="heroes" onMore={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
