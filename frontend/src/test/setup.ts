import { clearRequestCache } from "../services/requestCache";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, expect, vi } from "vitest";
import * as axeMatchers from "vitest-axe/matchers";

expect.extend(axeMatchers);

afterEach(() => {
  cleanup();
  clearRequestCache();
});

Object.defineProperty(window.navigator, "language", {
  value: "en-GB",
  configurable: true,
});

HTMLCanvasElement.prototype.getContext = vi.fn(
  () => null,
) as unknown as HTMLCanvasElement["getContext"];
