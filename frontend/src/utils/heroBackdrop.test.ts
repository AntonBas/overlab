import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkHeroBackdrop,
  heroBackdropStyle,
  heroBackdropUrl,
  resetHeroBackdropChecks,
} from "./heroBackdrop";

describe("hero backdrop", () => {
  afterEach(() => {
    resetHeroBackdropChecks();
    vi.unstubAllGlobals();
  });

  it("points to the hero's own image", () => {
    expect(
      heroBackdropStyle(heroBackdropUrl("junker-queen")).backgroundImage,
    ).toContain("/images/backgrounds/junker-queen.webp");
  });

  it("reports an image that loads as available and one that fails as missing", async () => {
    class FakeImage {
      onload: () => void = () => undefined;
      onerror: () => void = () => undefined;
      set src(value: string) {
        queueMicrotask(value.includes("new-hero") ? this.onerror : this.onload);
      }
    }
    vi.stubGlobal("Image", FakeImage);

    await expect(checkHeroBackdrop("tracer")).resolves.toBe(true);
    await expect(checkHeroBackdrop("new-hero")).resolves.toBe(false);
  });
});
