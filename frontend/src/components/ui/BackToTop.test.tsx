import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackToTop } from "./BackToTop";

function scrollTo(position: number) {
  Object.defineProperty(window, "scrollY", {
    value: position,
    configurable: true,
  });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("BackToTop", () => {
  afterEach(() => {
    scrollTo(0);
    vi.restoreAllMocks();
  });

  it("appears only after the page was scrolled down", () => {
    render(<BackToTop />);
    expect(
      screen.queryByRole("button", { name: "Back to top" }),
    ).not.toBeInTheDocument();

    scrollTo(1200);

    expect(
      screen.getByRole("button", { name: "Back to top" }),
    ).toBeInTheDocument();
  });

  it("scrolls to the top when clicked", async () => {
    const scroll = vi.fn();
    window.scrollTo = scroll;
    render(<BackToTop />);
    scrollTo(1200);

    await userEvent.click(screen.getByRole("button", { name: "Back to top" }));

    expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
  });
});
