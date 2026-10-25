import { describe, expect, it } from "vitest";
import {
  formatTimestamp,
  parseTimestamp,
  parseYoutubeId,
  slugify,
} from "./youtube";

describe("parseYoutubeId", () => {
  it.each([
    ["dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?t=42", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1s", "dQw4w9WgXcQ"],
    ["youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("extracts the id from %s", (input, expected) => {
    expect(parseYoutubeId(input)).toBe(expected);
  });

  it.each([
    "",
    "not a link",
    "https://example.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/short",
    "https://www.youtube.com/watch?v=short",
  ])("rejects %s", (input) => {
    expect(parseYoutubeId(input)).toBeNull();
  });
});

describe("parseTimestamp", () => {
  it.each([
    ["", 0],
    ["0:00", 0],
    ["1:23", 83],
    ["01:05", 65],
    ["1:02:03", 3723],
    ["90", 90],
  ])("parses %s", (input, expected) => {
    expect(parseTimestamp(input)).toBe(expected);
  });

  it.each(["1:75", "a:b", "1:2:3:4", "-5", "1:"])("rejects %s", (input) => {
    expect(parseTimestamp(input)).toBeNull();
  });
});

describe("formatTimestamp", () => {
  it("formats seconds into m:ss and h:mm:ss", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(83)).toBe("1:23");
    expect(formatTimestamp(3723)).toBe("1:02:03");
  });
});

describe("slugify", () => {
  it("produces lowercase dashed slugs", () => {
    expect(slugify("  Ana: Nade Timing! ")).toBe("ana-nade-timing");
  });
});
