import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const init = vi.hoisted(() => vi.fn());

vi.mock("@sentry/react", () => ({ init }));

describe("sentry", () => {
  beforeEach(() => {
    init.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("initialises with the dsn from the environment", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://key@sentry.example/1");

    await import("./sentry");

    expect(init).toHaveBeenCalledWith({
      dsn: "https://key@sentry.example/1",
      environment: "test",
    });
  });

  it("stays disabled without a dsn", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "");

    await import("./sentry");

    expect(init).not.toHaveBeenCalled();
  });
});
