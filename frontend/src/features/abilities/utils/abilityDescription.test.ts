import { describe, expect, it } from "vitest";
import { formatAbilityDescription } from "./abilityDescription";

describe("formatAbilityDescription", () => {
  it("turns glued fire labels into labelled sentences", () => {
    expect(
      formatAbilityDescription(
        "primary fire Long-range rifle that heals allies and damages enemies. secondary fire Hold to zoom in.",
      ),
    ).toBe(
      "Primary fire: Long-range rifle that heals allies and damages enemies. Secondary fire: Hold to zoom in.",
    );
  });

  it("leaves ordinary mentions of fire untouched", () => {
    const text = "Hold secondary fire to deploy a frontal energy barrier.";
    expect(formatAbilityDescription(text)).toBe(text);
  });

  it("calms shouted labels", () => {
    expect(
      formatAbilityDescription(
        "Press secondary fire to lock on, then SECONDARY FIRE to fire.",
      ),
    ).toBe("Press secondary fire to lock on, then secondary fire to fire.");
  });

  it("does not rewrite a lower-case continuation of the sentence", () => {
    const text = "Shoot the target. primary fire is the main attack.";
    expect(formatAbilityDescription(text)).toBe(text);
  });
});
