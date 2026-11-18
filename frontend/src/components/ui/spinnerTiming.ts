export const SPINNER_APPEARS_AFTER_MS = 200;
export const SPINNER_MIN_VISIBLE_MS = 400;
export const SPINNER_CONTINUATION_MS = 300;

export function remainingSpinnerTime(elapsedMs: number): number {
  if (elapsedMs <= SPINNER_APPEARS_AFTER_MS) {
    return 0;
  }
  return Math.max(
    0,
    SPINNER_APPEARS_AFTER_MS + SPINNER_MIN_VISIBLE_MS - elapsedMs,
  );
}

const mountedAt = new Map<symbol, number>();
let lastVisibleEndedAt = Number.NEGATIVE_INFINITY;

function isVisible(startedAt: number, now: number): boolean {
  return now - startedAt >= SPINNER_APPEARS_AFTER_MS;
}

export function isContinuingSpinner(now: number = Date.now()): boolean {
  for (const startedAt of mountedAt.values()) {
    if (isVisible(startedAt, now)) {
      return true;
    }
  }
  return now - lastVisibleEndedAt <= SPINNER_CONTINUATION_MS;
}

export function registerSpinner(): () => void {
  const id = Symbol("spinner");
  mountedAt.set(id, Date.now());
  return () => {
    const startedAt = mountedAt.get(id);
    mountedAt.delete(id);
    const now = Date.now();
    if (startedAt !== undefined && isVisible(startedAt, now)) {
      lastVisibleEndedAt = now;
    }
  };
}

export function phaseOffset(
  periodMs: number,
  staggerMs: number = 0,
  now: number = Date.now(),
): string {
  const phase = (((now - staggerMs) % periodMs) + periodMs) % periodMs;
  return `-${phase}ms`;
}
