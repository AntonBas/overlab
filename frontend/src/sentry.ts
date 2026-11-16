const dsn: string | undefined = import.meta.env.VITE_SENTRY_DSN;

let pending: Promise<void> = Promise.resolve();

export function startErrorReporting(): Promise<void> {
  if (!dsn) {
    return Promise.resolve();
  }
  pending = pending.then(async () => {
    const Sentry = await import("@sentry/react");
    if (Sentry.isInitialized()) {
      return;
    }
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
    });
  });
  return pending;
}

export function stopErrorReporting(): Promise<void> {
  if (!dsn) {
    return Promise.resolve();
  }
  pending = pending.then(async () => {
    const Sentry = await import("@sentry/react");
    if (Sentry.isInitialized()) {
      await Sentry.close();
    }
  });
  return pending;
}
