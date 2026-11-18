import { describe, expect, it } from "vitest";
import { splitRelationNote } from "./relationNote";

describe("splitRelationNote", () => {
  it("splits the reason from the limits", () => {
    expect(
      splitRelationNote(
        "Why it works: Barrier blocks shots. Limits: Boosters help her.",
      ),
    ).toEqual({
      reason: "Barrier blocks shots.",
      limits: "Boosters help her.",
    });
  });

  it("keeps a note without limits as the reason", () => {
    expect(splitRelationNote("Why it works: Barrier blocks shots.")).toEqual({
      reason: "Barrier blocks shots.",
      limits: null,
    });
  });

  it("treats a free-form note as the reason", () => {
    expect(splitRelationNote("Good together")).toEqual({
      reason: "Good together",
      limits: null,
    });
  });
});
