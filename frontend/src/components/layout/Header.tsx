import clsx from "clsx";
import { BarChart3, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/context/useAuth";
import { HeroSearch } from "./HeroSearch";

const LINKS = [
  { to: "/stats", label: "Statistics" },
  { to: "/heroes", label: "Heroes" },
  { to: "/maps", label: "Maps" },
  { to: "/patches", label: "Patches" },
];

export function Header() {
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="brand">
          <BarChart3 aria-hidden="true" size={22} />
          Overlab
        </Link>
        <button
          type="button"
          className="button button--ghost site-header__toggle"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? (
            <X aria-hidden="true" size={18} />
          ) : (
            <Menu aria-hidden="true" size={18} />
          )}
          Menu
        </button>
        <div
          id="site-menu"
          className={clsx("site-header__menu", {
            "site-header__menu--open": menuOpen,
          })}
        >
          <nav aria-label="Main" onClick={() => setMenuOpen(false)}>
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
              {user?.role === "ADMIN" && (
                <li>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      clsx("nav__link", { "nav__link--active": isActive })
                    }
                  >
                    Admin
                  </NavLink>
                </li>
              )}
            </ul>
          </nav>
          <HeroSearch />
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
      </div>
    </header>
  );
}
