const MAX_FRAMES = 60;
const USER_INPUT_EVENTS = ["wheel", "touchstart", "keydown"] as const;

/**
 * Scrolls to a remembered position and keeps trying for about a second, because the page may still be
 * loading and too short to reach it. Stops as soon as the user scrolls by hand. Returns a cancel function.
 */
export function restoreScroll(position: number): () => void {
  let frame = 0;
  let attempts = 0;
  let cancelled = false;

  function cancel() {
    cancelled = true;
    cancelAnimationFrame(frame);
    for (const name of USER_INPUT_EVENTS) {
      window.removeEventListener(name, cancel);
    }
  }

  function attempt() {
    if (cancelled) {
      return;
    }
    window.scrollTo(0, position);
    attempts += 1;
    if (Math.abs(window.scrollY - position) <= 1 || attempts >= MAX_FRAMES) {
      cancel();
      return;
    }
    frame = requestAnimationFrame(attempt);
  }

  for (const name of USER_INPUT_EVENTS) {
    window.addEventListener(name, cancel, { passive: true });
  }
  frame = requestAnimationFrame(attempt);
  return cancel;
}

const HOLD_FRAMES = 150;

/**
 * Brings an element to the top of the viewport and keeps it there while content above it is still loading
 * and shifting the layout. Stops after a few seconds or as soon as the user scrolls by hand. Returns a cancel function.
 */
export function holdElementInView(element: HTMLElement): () => void {
  let frame = 0;
  let frames = 0;
  let cancelled = false;

  function cancel() {
    cancelled = true;
    cancelAnimationFrame(frame);
    for (const name of USER_INPUT_EVENTS) {
      window.removeEventListener(name, cancel);
    }
  }

  const desiredTop = parseFloat(getComputedStyle(element).scrollMarginTop) || 0;

  function keep() {
    if (cancelled) {
      return;
    }
    const drift = element.getBoundingClientRect().top - desiredTop;
    if (Math.abs(drift) > 1) {
      window.scrollBy(0, drift);
    }
    frames += 1;
    if (frames >= HOLD_FRAMES) {
      cancel();
      return;
    }
    frame = requestAnimationFrame(keep);
  }

  for (const name of USER_INPUT_EVENTS) {
    window.addEventListener(name, cancel, { passive: true });
  }
  frame = requestAnimationFrame(keep);
  return cancel;
}
