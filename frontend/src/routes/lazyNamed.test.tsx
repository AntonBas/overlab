import { act, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { lazyNamed } from "./lazyNamed";

describe("lazyNamed", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the fallback for a minimum time once it could be visible", async () => {
    vi.useFakeTimers();
    const Page = lazyNamed(
      () =>
        new Promise<{ Page: () => React.ReactElement }>((resolve) => {
          setTimeout(() => resolve({ Page: () => <p>page ready</p> }), 250);
        }),
      "Page",
    );

    render(
      <Suspense fallback={<p>fallback</p>}>
        <Page />
      </Suspense>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByText("fallback")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(screen.getByText("page ready")).toBeInTheDocument();
  });
});
