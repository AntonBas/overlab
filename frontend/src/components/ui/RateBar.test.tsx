import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RateBar } from "./RateBar";

function fillOf(container: HTMLElement): HTMLElement {
  return container.querySelector(".rate-bar__fill") as HTMLElement;
}

describe("RateBar", () => {
  it("grows a win rate above 50% to the right of the middle in green", () => {
    const { container } = render(<RateBar value={53.8} tone="win" />);

    expect(fillOf(container).style.left).toBe("50%");
    expect(fillOf(container).style.width).toBe("19%");
    expect(fillOf(container)).toHaveClass("rate-bar__fill--win");
    expect(container.querySelector(".rate-bar__value")).toHaveClass(
      "rate-bar__value--above",
    );
  });

  it("grows a win rate below 50% to the left of the middle in red", () => {
    const { container } = render(<RateBar value={46.4} tone="win" />);

    expect(fillOf(container).style.left).toBe("32%");
    expect(fillOf(container).style.width).toBe("18%");
    expect(fillOf(container)).toHaveClass("rate-bar__fill--loss");
    expect(container.querySelector(".rate-bar__value")).toHaveClass(
      "rate-bar__value--below",
    );
  });

  it("caps the bar at the edges of the track", () => {
    const { container } = render(<RateBar value={80} tone="win" />);

    expect(fillOf(container).style.width).toBe("50%");
  });

  it("keeps pick and ban rates growing from the left", () => {
    const { container } = render(<RateBar value={20} tone="pick" max={40} />);

    expect(fillOf(container).style.width).toBe("50%");
    expect(fillOf(container).style.left).toBe("");
  });

  it("shows a dash without a value", () => {
    const { container } = render(<RateBar value={null} tone="win" />);

    expect(container).toHaveTextContent("-");
  });
});
