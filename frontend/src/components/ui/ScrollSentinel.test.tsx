import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScrollSentinel } from "./ScrollSentinel";

type Callback = (entries: { isIntersecting: boolean }[]) => void;

function stubObserver() {
  const callbacks: Callback[] = [];
  const disconnect = vi.fn();
  class FakeObserver {
    constructor(callback: Callback) {
      callbacks.push(callback);
    }
    observe = vi.fn();
    disconnect = disconnect;
  }
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  return { callbacks, disconnect };
}

describe("ScrollSentinel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks for more when it comes into view", () => {
    const { callbacks } = stubObserver();
    const onReach = vi.fn();
    render(<ScrollSentinel onReach={onReach} resetKey={12} />);

    callbacks[0]([{ isIntersecting: false }]);
    expect(onReach).not.toHaveBeenCalled();

    callbacks[0]([{ isIntersecting: true }]);
    expect(onReach).toHaveBeenCalledTimes(1);
  });

  it("observes again after the key changes", () => {
    const { callbacks, disconnect } = stubObserver();
    const { rerender } = render(
      <ScrollSentinel onReach={vi.fn()} resetKey={12} />,
    );

    rerender(<ScrollSentinel onReach={vi.fn()} resetKey={24} />);

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(callbacks).toHaveLength(2);
  });

  it("does nothing without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    expect(() =>
      render(<ScrollSentinel onReach={vi.fn()} resetKey={12} />),
    ).not.toThrow();
  });
});
