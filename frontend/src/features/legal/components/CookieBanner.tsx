import { Link } from "react-router-dom";
import { saveConsent } from "../consent/consentStore";
import { useConsent } from "../consent/useConsent";

export function CookieBanner() {
  const consent = useConsent();
  if (consent.decided) {
    return null;
  }
  return (
    <section className="cookie-banner" aria-label="Cookie preferences">
      <p>
        Only essential cookies by default. Analytics and advertising stay off
        unless you allow them. <Link to="/cookies">Choose more</Link>
      </p>
      <div className="cookie-banner__actions">
        <button
          type="button"
          className="button button--ghost"
          onClick={() => saveConsent({ analytics: false, advertising: false })}
        >
          Necessary only
        </button>
        <button
          type="button"
          className="button"
          onClick={() => saveConsent({ analytics: true, advertising: true })}
        >
          Accept all
        </button>
      </div>
    </section>
  );
}
