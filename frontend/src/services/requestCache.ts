import { api } from "./api";

const TIME_TO_LIVE_MILLISECONDS = 30_000;

interface Entry {
  promise: Promise<unknown>;
  expiresAt: number;
}

const entries = new Map<string, Entry>();

export function clearRequestCache(): void {
  entries.clear();
}

export function cachedGet<T>(url: string): Promise<T> {
  const existing = entries.get(url);
  if (existing && existing.expiresAt > Date.now()) {
    return existing.promise as Promise<T>;
  }
  const promise = api
    .get<T>(url)
    .then((response) => response.data)
    .catch((failure: unknown) => {
      entries.delete(url);
      throw failure;
    });
  entries.set(url, {
    promise,
    expiresAt: Date.now() + TIME_TO_LIVE_MILLISECONDS,
  });
  return promise;
}

api.interceptors.response.use((response) => {
  if (response.config.method !== "get") {
    clearRequestCache();
  }
  return response;
});
