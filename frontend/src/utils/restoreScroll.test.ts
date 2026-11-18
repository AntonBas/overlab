import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { restoreScroll } from "./restoreScroll";

describe("restoreScroll", () => {
  let reachable = 0;
  let scrollY = 0;

  beforeEach(() => {
    vi.useFakeTimers();
    reachable = 0;
    scrollY = 0;
    vi.spyOn(window, "scrollTo").mockImplementation((_x, y) => {
      scrollY = Math.min(Number(y), reachable);
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: () => scrollY,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("keeps trying until the page is tall enough", () => {
    reachable = 400;
    restoreScroll(1500);

    vi.advanceTimersByTime(100);
    expect(scrollY).toBe(400);

    reachable = 3000;
    vi.advanceTimersByTime(100);
    expect(scrollY).toBe(1500);
  });

  it("gives up after about a second", () => {
    reachable = 0;
    restoreScroll(1500);

    vi.advanceTimersByTime(3000);
    const calls = vi.mocked(window.scrollTo).mock.calls.length;
    vi.advanceTimersByTime(3000);

    expect(vi.mocked(window.scrollTo).mock.calls.length).toBe(calls);
    expect(calls).toBeLessThanOrEqual(60);
  });

  it("stops when the user scrolls by hand", () => {
    reachable = 0;
    restoreScroll(1500);
    vi.advanceTimersByTime(50);
    const calls = vi.mocked(window.scrollTo).mock.calls.length;

    window.dispatchEvent(new Event("wheel"));
    reachable = 3000;
    vi.advanceTimersByTime(500);

    expect(vi.mocked(window.scrollTo).mock.calls.length).toBe(calls);
  });

  it("can be cancelled", () => {
    reachable = 0;
    const cancel = restoreScroll(1500);
    cancel();

    vi.advanceTimersByTime(500);

    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
