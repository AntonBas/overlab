import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("announces its label", () => {
    const { getByRole } = render(<Spinner label="Loading heroes" />);

    expect(getByRole("status")).toHaveTextContent("Loading heroes...");
  });

  it("fades in after a delay when nothing was loading before", () => {
    const { getByRole } = render(<Spinner />);

    expect(getByRole("status").style.animationDelay).toBe("200ms");
  });

  it("shows at once when it replaces a spinner that was already visible", () => {
    vi.useFakeTimers();
    const first = render(<Spinner />);
    vi.advanceTimersByTime(250);
    first.unmount();

    const second = render(<Spinner />);

    expect(second.getByRole("status").style.animationDelay).toBe("0s");
    expect(second.getByRole("status").style.animationDuration).toBe("0s");
  });
});
