import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>
          Overlab is an unofficial fan site and is not affiliated with or
          endorsed by Blizzard Entertainment. Overwatch is a trademark of
          Blizzard Entertainment.
        </p>
        <p className="muted">
          Statistics come from Blizzard's public hero statistics page. Counters,
          synergies and perks are curated recommendations.
        </p>
        <nav className="site-footer__links" aria-label="Legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/cookies">Cookies</Link>
        </nav>
      </div>
    </footer>
  );
}
