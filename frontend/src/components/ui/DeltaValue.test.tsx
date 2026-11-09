import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeltaValue } from "./DeltaValue";

describe("DeltaValue", () => {
  it("marks an increase as positive", () => {
    render(<DeltaValue value={2.34} />);

    const element = screen.getByText("+2.3");
    expect(element).toHaveClass("delta--up");
  });

  it("marks a decrease as negative", () => {
    render(<DeltaValue value={-1.5} />);

    expect(screen.getByText("−1.5")).toHaveClass("delta--down");
  });

  it("can treat a decrease as good, for example for ban rate", () => {
    render(<DeltaValue value={-1.5} inverted />);

    expect(screen.getByText("−1.5")).toHaveClass("delta--up");
  });

  it("renders nothing without a value", () => {
    const { container } = render(<DeltaValue value={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
