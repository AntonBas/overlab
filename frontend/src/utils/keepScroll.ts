export const KEEP_SCROLL_STATE = { keepScroll: true } as const;

export function keepsScroll(state: unknown): boolean {
  return typeof state === "object" && state !== null && "keepScroll" in state;
}
