import { describe, expect, it } from "vitest";
import { heroBackdropStyle } from "./heroBackdrop";

describe("heroBackdropStyle", () => {
  it("points to the hero's own image", () => {
    expect(heroBackdropStyle("junker-queen")?.backgroundImage).toContain(
      "/images/backgrounds/junker-queen.webp",
    );
  });

  it("returns nothing for a hero without an image", () => {
    expect(heroBackdropStyle("new-hero")).toBeUndefined();
  });
});
