import { Link } from "react-router-dom";
import { PageHeader } from "../../../components/ui/PageHeader";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { LEGAL_LAST_UPDATED } from "../lastUpdated";
import { ContactLine } from "../components/ContactLine";
import { controllerAddress, controllerName } from "../contact";
import { staticSeoPage } from "../../../utils/staticSeoPages";

export function PrivacyPage() {
  usePageTitle(staticSeoPage("/privacy").title);
  return (
    <div className="legal-page">
      <PageHeader
        title="Privacy policy"
        subtitle={`Last updated ${LEGAL_LAST_UPDATED}`}
      />
      <div className="legal">
        <details className="legal-section" open>
          <summary>
            <h2>Who we are</h2>
          </summary>
          <p>
            Overlab is an unofficial fan site with hero statistics. It is not
            affiliated with Blizzard Entertainment.
          </p>
          {controllerName ? (
            <p>
              Data controller: {controllerName}
              {controllerAddress ? `, ${controllerAddress}` : ""}.
            </p>
          ) : (
            <p>The site is run by an individual.</p>
          )}
          <ContactLine />
        </details>
        <details className="legal-section">
          <summary>
            <h2>What we collect</h2>
          </summary>
          <p>
            Browsing the statistics needs no account, and we do not ask for any
            personal data. If you create an account, we store:
          </p>
          <ul>
            <li>your email address and display name;</li>
            <li>
              a salted password hash (never the password itself) or, if you sign
              in with Google, your Google account identifier;
            </li>
            <li>whether your email is verified and when you last signed in;</li>
            <li>
              the heroes, maps and guides you save to your personal library;
            </li>
            <li>
              your votes on counters and synergies, which only administrators
              can see.
            </li>
          </ul>
          <p>
            If you send us a feedback message, we store its text and the page
            you sent it from. When you are signed in, the message is linked to
            your account. If you delete the account, the message is kept without
            the link.
          </p>
          <p>
            Our security log records account events (sign-in, password change,
            account deletion) together with the IP address of the request. These
            entries are deleted automatically after 90 days.
          </p>
        </details>
        <details className="legal-section">
          <summary>
            <h2>Server logs and abuse protection</h2>
          </summary>
          <p>
            Like every web server, ours processes the IP address, browser
            identifier and requested address of each request. Short-lived
            counters keyed by IP address (and, for sign-in attempts, by email
            address) limit how many requests one visitor can make and are
            discarded within an hour. Technical server logs are rotated
            automatically by size, so they hold only the most recent days or
            weeks of traffic.
          </p>
        </details>
        <details className="legal-section">
          <summary>
            <h2>Why we use it</h2>
          </summary>
          <ul>
            <li>To run your account and keep you signed in.</li>
            <li>
              To send service emails: address confirmation and password reset.
            </li>
            <li>To protect the site from abuse and investigate incidents.</li>
            <li>
              With your consent only: to count visits anonymously and to receive
              error reports that help us fix bugs.
            </li>
          </ul>
        </details>
        <details className="legal-section">
          <summary>
            <h2>Legal basis</h2>
          </summary>
          <ul>
            <li>
              Running your account and sending service emails: performing the
              agreement you enter into when you register.
            </li>
            <li>
              Security log, server logs and abuse protection: our legitimate
              interest in keeping the site secure and available.
            </li>
            <li>
              Anonymous visit statistics and error reports: your consent, which
              you can withdraw at any time in the{" "}
              <Link to="/cookies">cookie settings</Link>.
            </li>
          </ul>
        </details>
        <details className="legal-section">
          <summary>
            <h2>Cookies and local storage</h2>
          </summary>
          <p>
            Sign-in uses two strictly necessary cookies. Optional anonymous
            visit statistics (Umami, no cookies, no personal identifiers), error
            reports (Sentry) and advertising are off until you allow them.
            Details are in the <Link to="/cookies">cookie policy</Link>.
          </p>
        </details>
        <details className="legal-section">
          <summary>
            <h2>Who receives data</h2>
          </summary>
          <p>
            Data is processed by our hosting provider, our email delivery
            provider, our analytics provider Umami (only with your consent), our
            error reporting provider Sentry (only with your consent) and, if you
            choose Google sign-in, Google. Error reports contain the page
            address, browser and device type, the error message and technical
            details of the error; we configure Sentry not to store IP addresses
            and do not send account data to it. Guide pages load video
            thumbnails from YouTube (Google), which therefore sees your IP
            address, and the player loads only when you press play. We do not
            sell personal data.
          </p>
        </details>
        <details className="legal-section">
          <summary>
            <h2>How long we keep it</h2>
          </summary>
          <p>
            Account data is kept until you delete your account. Security log
            entries are kept for 90 days. Error reports are kept for the
            retention period set in our Sentry project. Backups are rotated and
            may hold deleted data for a limited time before they expire.
          </p>
        </details>
        <details className="legal-section">
          <summary>
            <h2>Your rights</h2>
          </summary>
          <p>
            You can export your data and delete your account at any time in{" "}
            <Link to="/me/settings">account settings</Link>. You may also ask us
            to correct your data or object to its processing, and you may
            complain to your local data protection authority.
          </p>
        </details>
        <details className="legal-section">
          <summary>
            <h2>Changes</h2>
          </summary>
          <p>We will update this page whenever our practices change.</p>
        </details>
      </div>
    </div>
  );
}
