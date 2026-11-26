import { Link, useLocation } from "react-router-dom";
import { fetchGuides } from "../../features/guides";
import { useFetch } from "../../hooks/useFetch";
import { FOOTER_LINKS } from "./navLinks";

export function Footer() {
  const { pathname } = useLocation();
  const guides = useFetch(() => fetchGuides(), []);
  const hasGuides = (guides.data?.length ?? 0) > 0;
  const exploreLinks = FOOTER_LINKS.filter(
    (link) => hasGuides || link.to !== "/guides",
  );
  const feedbackPath = pathname.startsWith("/feedback")
    ? "/feedback"
    : `/feedback?from=${encodeURIComponent(pathname)}`;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__main">
          <div className="site-footer__brand">
            <Link to="/" className="brand">
              <img
                src="/favicon.svg"
                alt=""
                width={28}
                height={28}
                className="brand__logo"
              />
              Overlab
            </Link>
            <p>
              Hero statistics, counters, synergies and perks, with history
              across patches.
            </p>
          </div>
          <nav className="site-footer__column" aria-label="Explore">
            <h2>Explore</h2>
            {exploreLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                {link.label}
              </Link>
            ))}
          </nav>
          <nav className="site-footer__column" aria-label="Legal">
            <h2>Site</h2>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/cookies">Cookies</Link>
            <Link to={feedbackPath} rel="nofollow">
              Send feedback
            </Link>
            <Link to="/business">Sponsorship and business</Link>
          </nav>
        </div>
        <div className="site-footer__fine-print">
          <p>
            Overlab is an unofficial fan site and is not affiliated with or
            endorsed by Blizzard Entertainment. Overwatch is a trademark of
            Blizzard Entertainment.
          </p>
          <p>
            Statistics come from Blizzard's public hero statistics page.
            Counters, synergies and perks are curated recommendations.
          </p>
        </div>
      </div>
    </footer>
  );
}
