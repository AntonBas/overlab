import { describe, expect, it } from "vitest";
import {
  describeActor,
  describeEntity,
  formatAuditValue,
  splitWords,
} from "./audit";

describe("audit formatting", () => {
  it("splits camel case identifiers into words", () => {
    expect(splitWords("rowsSaved")).toBe("Rows saved");
    expect(splitWords("CollectorRun")).toBe("Collector run");
  });

  it("describes the actor", () => {
    expect(describeActor(null, null)).toBe("System");
    expect(describeActor(9, "ADMIN")).toBe("User #9 (Admin)");
  });

  it("describes the entity", () => {
    expect(describeEntity("CollectorRun", "43")).toBe("Collector run #43");
    expect(describeEntity("Hero", null)).toBe("Hero");
  });

  it("formats values for reading", () => {
    expect(formatAuditValue(null)).toBe("empty");
    expect(formatAuditValue(true)).toBe("yes");
    expect(formatAuditValue("RECOMMENDED")).toBe("Recommended");
    expect(formatAuditValue("Ana")).toBe("Ana");
    expect(formatAuditValue(12)).toBe("12");
  });
});
