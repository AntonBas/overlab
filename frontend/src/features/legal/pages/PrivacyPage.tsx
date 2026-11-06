import { Link } from "react-router-dom";
import { PageHeader } from "../../../components/ui/PageHeader";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { ContactLine } from "../components/ContactLine";

export function PrivacyPage() {
  usePageTitle("Privacy policy");
  return (
    <>
      <PageHeader title="Privacy policy" />
      <div className="legal">
        <section>
          <h2>Who we are</h2>
          <p>
            Overlab is an unofficial fan site with hero statistics. It is run by
            an individual and is not affiliated with Blizzard Entertainment.
          </p>
          <ContactLine />
        </section>
        <section>
          <h2>What we collect</h2>
          <p>
            Browsing the statistics needs no account and we do not ask for any
            personal data. If you create an account we store:
          </p>
          <ul>
            <li>your email address and display name;</li>
            <li>
              a salted password hash (never the password itself) or, if you sign
              in with Google, your Google account identifier;
            </li>
            <li>whether your email is verified and when you last signed in;</li>
            <li>
              the heroes, maps and guides you save to your personal library.
            </li>
          </ul>
          <p>
            Our security log records account events (sign-in, password change,
            account deletion) together with the IP address of the request. These
            entries are deleted automatically after 90 days.
          </p>
        </section>
        <section>
          <h2>Why we use it</h2>
          <ul>
            <li>To run your account and keep you signed in.</li>
            <li>
              To send service emails: address confirmation and password reset.
            </li>
            <li>To protect the site from abuse and investigate incidents.</li>
          </ul>
        </section>
        <section>
          <h2>Cookies and local storage</h2>
          <p>
            Sign-in uses two strictly necessary cookies. Optional analytics and
            advertising are off until you allow them. Details are in the{" "}
            <Link to="/cookies">cookie policy</Link>.
          </p>
        </section>
        <section>
          <h2>Who receives data</h2>
          <p>
            Data is processed by our hosting provider, our email delivery
            provider and, if you choose Google sign-in, Google. We do not sell
            personal data.
          </p>
        </section>
        <section>
          <h2>How long we keep it</h2>
          <p>
            Account data is kept until you delete your account. Security log
            entries are kept for 90 days. Backups are rotated and may hold
            deleted data for a limited time before they expire.
          </p>
        </section>
        <section>
          <h2>Your rights</h2>
          <p>
            You can export your data and delete your account at any time in{" "}
            <Link to="/me/settings">account settings</Link>. You may also ask us
            to correct your data or object to its processing, and you may
            complain to your local data protection authority.
          </p>
        </section>
        <section>
          <h2>Changes</h2>
          <p>
            We will update this page when our practices change and note the date
            of the latest revision here.
          </p>
        </section>
      </div>
    </>
  );
}
