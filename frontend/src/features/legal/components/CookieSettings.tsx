import { saveConsent } from "../consent/consentStore";
import { useConsent } from "../consent/useConsent";

export function CookieSettings() {
  const consent = useConsent();
  return (
    <fieldset className="cookie-settings">
      <legend>Your choices</legend>
      <label>
        <input type="checkbox" checked disabled /> Necessary (always on)
      </label>
      <label>
        <input
          type="checkbox"
          checked={consent.analytics}
          onChange={(event) =>
            saveConsent({
              analytics: event.target.checked,
              advertising: consent.advertising,
            })
          }
        />{" "}
        Analytics and error reports
      </label>
      <label>
        <input
          type="checkbox"
          checked={consent.advertising}
          onChange={(event) =>
            saveConsent({
              analytics: consent.analytics,
              advertising: event.target.checked,
            })
          }
        />{" "}
        Advertising
      </label>
    </fieldset>
  );
}
