import clsx from "clsx";
import { BarChart3 } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/context/useAuth";

const LINKS = [
  { to: "/stats", label: "Statistics" },
  { to: "/heroes", label: "Heroes" },
  { to: "/maps", label: "Maps" },
];

export function Header() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="brand">
          <BarChart3 aria-hidden="true" size={22} />
          Overlab
        </Link>
        <nav aria-label="Main">
          <ul className="nav">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    clsx("nav__link", { "nav__link--active": isActive })
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-header__account">
          {!loading && user && (
            <>
              <span className="muted">{user.displayName}</span>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => void signOut()}
              >
                Sign out
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link className="nav__link" to="/login">
                Sign in
              </Link>
              <Link className="button" to="/register">
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
