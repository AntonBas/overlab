import { PageHeader } from "../../../components/ui/PageHeader";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { LEGAL_LAST_UPDATED } from "../lastUpdated";
import { CookieSettings } from "../components/CookieSettings";

export function CookiesPage() {
  usePageTitle("Cookie policy");
  return (
    <div className="legal-page">
      <PageHeader
        title="Cookie policy"
        subtitle={`Last updated ${LEGAL_LAST_UPDATED}`}
      />
      <div className="legal">
        <details className="legal-section" open>
          <summary>
            <h2>Necessary</h2>
          </summary>
          <p>These are needed to sign in and cannot be turned off.</p>
          <ul>
            <li>
              <code>access_token</code>: proves you are signed in. Removed when
              you sign out.
            </li>
            <li>
              <code>refresh_token</code>: renews your session without asking for
              your password again. Removed when you sign out.
            </li>
          </ul>
        </details>
        <details className="legal-section">
          <summary>
            <h2>Local storage</h2>
          </summary>
          <p>
            These are not cookies. They stay in your browser and are never sent
            to our servers.
          </p>
          <ul>
            <li>
              <code>overlab.controlScheme</code>: remembers the controller
              layout you picked.
            </li>
            <li>
              <code>overlab.region</code>: remembers the statistics region you
              picked.
            </li>
            <li>
              <code>overlab.session</code>: remembers whether you were signed
              in, so the site does not ask the server needlessly.
            </li>
            <li>Your choices on this page.</li>
          </ul>
        </details>
        <details className="legal-section">
          <summary>
            <h2>Analytics</h2>
          </summary>
          <p>
            Off until you allow it here. When allowed, Umami Cloud (EU) counts
            visits anonymously. It sets no cookies, does not track you across
            sites and respects the Do Not Track setting.
          </p>
        </details>
        <details className="legal-section">
          <summary>
            <h2>Advertising</h2>
          </summary>
          <p>
            Off by default. Advertising scripts, if added, will only load after
            you allow them here.
          </p>
        </details>
        <CookieSettings />
      </div>
    </div>
  );
}
