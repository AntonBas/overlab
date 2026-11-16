import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  close: vi.fn(() => Promise.resolve(true)),
  isInitialized: vi.fn(() => false),
}));

vi.mock("@sentry/react", () => sentry);

describe("sentry", () => {
  beforeEach(() => {
    sentry.init.mockClear();
    sentry.close.mockClear();
    sentry.isInitialized.mockReset();
    sentry.isInitialized.mockReturnValue(false);
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does nothing until reporting is started", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://key@sentry.example/1");

    await import("./sentry");

    expect(sentry.init).not.toHaveBeenCalled();
  });

  it("starts with the dsn from the environment", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://key@sentry.example/1");
    const { startErrorReporting } = await import("./sentry");

    await startErrorReporting();

    expect(sentry.init).toHaveBeenCalledWith({
      dsn: "https://key@sentry.example/1",
      environment: "test",
    });
  });

  it("does not start twice", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://key@sentry.example/1");
    sentry.isInitialized.mockReturnValue(true);
    const { startErrorReporting } = await import("./sentry");

    await startErrorReporting();

    expect(sentry.init).not.toHaveBeenCalled();
  });

  it("closes the client when reporting is stopped", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://key@sentry.example/1");
    sentry.isInitialized.mockReturnValue(true);
    const { stopErrorReporting } = await import("./sentry");

    await stopErrorReporting();

    expect(sentry.close).toHaveBeenCalled();
  });

  it("stays disabled without a dsn", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "");
    const { startErrorReporting, stopErrorReporting } =
      await import("./sentry");

    await startErrorReporting();
    await stopErrorReporting();

    expect(sentry.init).not.toHaveBeenCalled();
    expect(sentry.close).not.toHaveBeenCalled();
  });
});
