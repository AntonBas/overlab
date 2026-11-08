import { PageHeader } from "../../../components/ui/PageHeader";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { ContactLine } from "../components/ContactLine";

export function TermsPage() {
  usePageTitle("Terms of use");
  return (
    <div className="legal-page">
      <PageHeader title="Terms of use" />
      <div className="legal">
        <section>
          <h2>About the site</h2>
          <p>
            Overlab is an unofficial fan site. It is not affiliated with or
            endorsed by Blizzard Entertainment. Overwatch and related names are
            trademarks of Blizzard Entertainment.
          </p>
        </section>
        <section>
          <h2>Statistics and recommendations</h2>
          <p>
            Statistics come from Blizzard's public hero statistics page and may
            be delayed, incomplete or change without notice. Counter-picks,
            synergies, perks and guides are curated recommendations, not
            statistics. Everything is provided as is, without warranty.
          </p>
        </section>
        <section>
          <h2>Accounts</h2>
          <p>
            You are responsible for keeping your credentials safe. Do not abuse
            the service, attempt to bypass its limits or scrape it faster than a
            normal visitor. We may suspend accounts that break these terms.
          </p>
        </section>
        <section>
          <h2>Content and links</h2>
          <p>
            Guide videos and external links belong to their owners. We are not
            responsible for third-party sites.
          </p>
        </section>
        <section>
          <h2>Liability</h2>
          <p>
            To the extent the law allows, we are not liable for losses caused by
            using or being unable to use the site.
          </p>
        </section>
        <section>
          <h2>Changes and contact</h2>
          <p>We may update these terms; continued use means you accept them.</p>
          <ContactLine />
        </section>
      </div>
    </div>
  );
}
