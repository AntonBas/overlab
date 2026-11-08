import { PageHeader } from "../../../components/ui/PageHeader";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { CookieSettings } from "../components/CookieSettings";

export function CookiesPage() {
  usePageTitle("Cookie policy");
  return (
    <div className="legal-page">
      <PageHeader title="Cookie policy" />
      <div className="legal">
        <section>
          <h2>Necessary</h2>
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
            <li>
              <code>overlab.controlScheme</code> and your choices on this page
              are kept in your browser's local storage to remember preferences.
            </li>
          </ul>
        </section>
        <section>
          <h2>Analytics</h2>
          <p>
            Off by default. If enabled in the future, it will only load after
            you allow it here.
          </p>
        </section>
        <section>
          <h2>Advertising</h2>
          <p>
            Off by default. Advertising scripts, if added, will only load after
            you allow them here.
          </p>
        </section>
        <CookieSettings />
      </div>
    </div>
  );
}
