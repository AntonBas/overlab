import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetConsent, saveConsent } from "../consent/consentStore";

const reporting = vi.hoisted(() => ({
  startErrorReporting: vi.fn(() => Promise.resolve()),
  stopErrorReporting: vi.fn(() => Promise.resolve()),
}));

vi.mock("../../../sentry", () => reporting);

import { ErrorReportingLoader } from "./ErrorReportingLoader";

describe("ErrorReportingLoader", () => {
  beforeEach(() => {
    reporting.startErrorReporting.mockClear();
    reporting.stopErrorReporting.mockClear();
    resetConsent();
  });

  afterEach(() => {
    resetConsent();
  });

  it("stays off until the visitor allows analytics", () => {
    render(<ErrorReportingLoader />);

    expect(reporting.startErrorReporting).not.toHaveBeenCalled();
  });

  it("starts after consent and stops when it is withdrawn", () => {
    saveConsent({ analytics: true, advertising: false });
    const { unmount } = render(<ErrorReportingLoader />);

    expect(reporting.startErrorReporting).toHaveBeenCalledTimes(1);

    unmount();

    expect(reporting.stopErrorReporting).toHaveBeenCalledTimes(1);
  });
});
