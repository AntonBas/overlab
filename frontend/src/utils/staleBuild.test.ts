import { beforeEach, describe, expect, it, vi } from "vitest";
import { isChunkLoadError, reloadForNewBuild } from "./staleBuild";

describe("isChunkLoadError", () => {
  it("recognises a lazy chunk that is gone after a new build", () => {
    expect(
      isChunkLoadError(
        new TypeError(
          "Failed to fetch dynamically imported module: https://x/assets/a-1.js",
        ),
      ),
    ).toBe(true);
    expect(
      isChunkLoadError(new Error("error loading dynamically imported module")),
    ).toBe(true);
    expect(
      isChunkLoadError(new Error("Importing a module script failed.")),
    ).toBe(true);
  });

  it("ignores other errors", () => {
    expect(isChunkLoadError(new Error("boom"))).toBe(false);
    expect(
      isChunkLoadError("Failed to fetch dynamically imported module"),
    ).toBe(false);
  });
});

describe("reloadForNewBuild", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("reloads once and then stops so a missing file cannot cause a loop", () => {
    const reload = vi.fn();

    expect(reloadForNewBuild(reload)).toBe(true);
    expect(reloadForNewBuild(reload)).toBe(false);

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
