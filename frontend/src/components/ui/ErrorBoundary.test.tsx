import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reloadForNewBuild } from "../../utils/staleBuild";
import { ErrorBoundary } from "./ErrorBoundary";

vi.mock("../../utils/staleBuild", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../utils/staleBuild")>()),
  reloadForNewBuild: vi.fn(() => false),
}));

function Broken(): never {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a readable message instead of a blank page", () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
  });

  it("recovers when the reset key changes", () => {
    const { rerender } = render(
      <ErrorBoundary resetKey="/a">
        <Broken />
      </ErrorBoundary>,
    );
    rerender(
      <ErrorBoundary resetKey="/b">
        <p>fine now</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("fine now")).toBeInTheDocument();
  });

  it("renders children when nothing fails", () => {
    render(
      <ErrorBoundary>
        <p>content</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("reloads once instead of failing when a page chunk is gone after an update", () => {
    vi.mocked(reloadForNewBuild).mockReturnValue(true);
    function Stale(): never {
      throw new TypeError(
        "Failed to fetch dynamically imported module: /assets/HeroPage-old.js",
      );
    }

    render(
      <ErrorBoundary>
        <Stale />
      </ErrorBoundary>,
    );

    expect(reloadForNewBuild).toHaveBeenCalledTimes(1);
  });
});
