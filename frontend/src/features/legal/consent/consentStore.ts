const STORAGE_KEY = "overlab-cookie-consent";

export interface ConsentChoice {
  analytics: boolean;
  advertising: boolean;
}

export interface ConsentState extends ConsentChoice {
  decided: boolean;
}

const undecided: ConsentState = {
  analytics: false,
  advertising: false,
  decided: false,
};

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedState: ConsentState = undecided;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): ConsentState {
  if (!raw) {
    return undecided;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value === "object" && value !== null) {
      const choice = value as Partial<ConsentChoice>;
      if (
        typeof choice.analytics === "boolean" &&
        typeof choice.advertising === "boolean"
      ) {
        return {
          analytics: choice.analytics,
          advertising: choice.advertising,
          decided: true,
        };
      }
    }
  } catch {
    return undecided;
  }
  return undecided;
}

export function getConsent(): ConsentState {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedState = parse(raw);
  }
  return cachedState;
}

export function saveConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
  } catch {
    cachedRaw = null;
    cachedState = { ...choice, decided: true };
  }
  listeners.forEach((listener) => listener());
}

export function resetConsent(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    cachedRaw = null;
  }
  cachedState = undecided;
  listeners.forEach((listener) => listener());
}

export function subscribeToConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
