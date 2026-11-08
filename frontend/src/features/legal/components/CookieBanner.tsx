import { Link } from "react-router-dom";
import { saveConsent } from "../consent/consentStore";
import { useConsent } from "../consent/useConsent";
import "../legal.css";

export function CookieBanner() {
  const consent = useConsent();
  if (consent.decided) {
    return null;
  }
  return (
    <section className="cookie-banner" aria-label="Cookie preferences">
      <p>
        Overlab uses only the cookies needed to keep you signed in. Optional
        analytics and advertising stay off unless you allow them. See the{" "}
        <Link to="/cookies">cookie policy</Link>.
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
