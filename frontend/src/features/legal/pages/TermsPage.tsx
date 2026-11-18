import { PageHeader } from "../../../components/ui/PageHeader";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { LEGAL_LAST_UPDATED } from "../lastUpdated";
import { ContactLine } from "../components/ContactLine";
import { staticSeoPage } from "../../../utils/staticSeoPages";

export function TermsPage() {
  usePageTitle(staticSeoPage("/terms").title);
  return (
    <div className="legal-page">
      <PageHeader
        title="Terms of use"
        subtitle={`Last updated ${LEGAL_LAST_UPDATED}`}
      />
      <div className="legal">
        <details className="legal-section" open>
          <summary>
            <h2>About the site</h2>
          </summary>
          <p>
            Overlab is an unofficial fan site. It is not affiliated with or
            endorsed by Blizzard Entertainment. Overwatch and related names are
            trademarks of Blizzard Entertainment.
          </p>
        </details>
        <details className="legal-section">
          <summary>
            <h2>Statistics and recommendations</h2>
          </summary>
          <p>
            Statistics come from Blizzard's public hero statistics page and may
            be delayed or incomplete, or change without notice. Counter-picks,
            synergies, perks and guides are curated recommendations, not
            statistics. Everything is provided as is, without warranty.
          </p>
        </details>
        <details className="legal-section">
          <summary>
            <h2>Accounts</h2>
          </summary>
          <p>
            You are responsible for keeping your credentials safe. Do not abuse
            the service, attempt to bypass its limits or scrape it faster than a
            normal visitor. We may suspend accounts that break these terms.
          </p>
        </details>
        <details className="legal-section">
          <summary>
            <h2>Content and links</h2>
          </summary>
          <p>
            Guide videos and external links belong to their owners. We are not
            responsible for third-party sites.
          </p>
        </details>
        <details className="legal-section">
          <summary>
            <h2>Liability</h2>
          </summary>
          <p>
            To the extent the law allows, we are not liable for losses caused by
            using or being unable to use the site.
          </p>
        </details>
        <details className="legal-section">
          <summary>
            <h2>Changes and contact</h2>
          </summary>
          <p>We may update these terms; continued use means you accept them.</p>
          <ContactLine />
        </details>
      </div>
    </div>
  );
}
