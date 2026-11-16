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
