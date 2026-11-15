const STORAGE_KEY = "overlab.session";

type Hint = "active" | "ended";

export function readSessionHint(): Hint | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "active" || stored === "ended" ? stored : null;
  } catch {
    return null;
  }
}

export function writeSessionHint(hint: Hint): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, hint);
  } catch {
    return;
  }
}
