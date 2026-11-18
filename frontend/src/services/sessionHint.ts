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

const ROLE_STORAGE_KEY = "overlab.role";

export function readRoleHint(): string | null {
  try {
    return window.localStorage.getItem(ROLE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeRoleHint(role: string | null): void {
  try {
    if (role === null) {
      window.localStorage.removeItem(ROLE_STORAGE_KEY);
    } else {
      window.localStorage.setItem(ROLE_STORAGE_KEY, role);
    }
  } catch {
    return;
  }
}
