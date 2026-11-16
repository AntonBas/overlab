import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth";
import { useRegion } from "../../features/stats";
import { REGIONS } from "../../features/stats";
import type { Region } from "../../types/common";
import { REGION_LABELS } from "../../utils/format";
import { HeroSearch } from "./HeroSearch";
import { NAV_LINKS } from "./navLinks";

export function Header() {
  const { user, loading, signOut } = useAuth();
  const { region, rememberRegion } = useRegion();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggle.current?.focus();
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
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
        <button
          type="button"
          ref={toggle}
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
              {NAV_LINKS.map((link) => (
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
          <div className="site-header__tools">
            <HeroSearch />
            <select
              className="site-header__region"
              aria-label="Region"
              value={region}
              onChange={(event) => rememberRegion(event.target.value as Region)}
            >
              {REGIONS.map((option) => (
                <option key={option} value={option}>
                  {REGION_LABELS[option]}
                </option>
              ))}
            </select>
            <div className="site-header__account">
              {!loading && user && (
                <>
                  <Link className="nav__link" to="/me" title={user.displayName}>
                    My Overlab
                  </Link>
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
                <Link
                  className="button button--compact site-header__signin"
                  to="/login"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
