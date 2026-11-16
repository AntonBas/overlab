import { afterEach, describe, expect, it } from "vitest";
import { getConsent, resetConsent, saveConsent } from "./consentStore";

const KEY = "overlab-cookie-consent";

describe("consentStore", () => {
  afterEach(() => {
    resetConsent();
  });

  it("is undecided without a stored choice", () => {
    expect(getConsent()).toEqual({
      analytics: false,
      advertising: false,
      decided: false,
    });
  });

  it("returns the stored choice", () => {
    saveConsent({ analytics: true, advertising: false });

    expect(getConsent()).toEqual({
      analytics: true,
      advertising: false,
      decided: true,
    });
  });

  it.each([["{}"], ["[]"], ["null"], ['{"analytics":true}'], ["not json"]])(
    "treats the damaged value %s as undecided",
    (raw) => {
      window.localStorage.setItem(KEY, raw);

      expect(getConsent().decided).toBe(false);
      expect(getConsent().analytics).toBe(false);
    },
  );
});
