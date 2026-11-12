import clsx from "clsx";
import { BadgeCheck, Mail, MailWarning, ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { User } from "../../../types/user";

const TABS = [
  { to: "/me", label: "My Overlab", end: true },
  { to: "/me/settings", label: "Settings", end: false },
] as const;

export function AccountHeader({ user }: { user: User }) {
  return (
    <header className="account-header">
      <div className="account-header__body">
        <div className="account-header__identity">
          <h1>{user.displayName}</h1>
          <p className="muted">{user.email}</p>
          <ul className="account-header__badges">
            {user.role === "ADMIN" && (
              <li className="account-badge account-badge--admin">
                <ShieldCheck size={14} aria-hidden="true" />
                Admin
              </li>
            )}
            <li className="account-badge">
              <Mail size={14} aria-hidden="true" />
              {user.provider === "GOOGLE" ? "Google sign-in" : "Email sign-in"}
            </li>
            <li
              className={clsx("account-badge", {
                "account-badge--good": user.emailVerified,
                "account-badge--warn": !user.emailVerified,
              })}
            >
              {user.emailVerified ? (
                <BadgeCheck size={14} aria-hidden="true" />
              ) : (
                <MailWarning size={14} aria-hidden="true" />
              )}
              {user.emailVerified ? "Email verified" : "Email not verified"}
            </li>
          </ul>
        </div>
      </div>
      <nav className="account-header__tabs" aria-label="Account">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              clsx("account-tab", { "account-tab--active": isActive })
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
