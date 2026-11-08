import clsx from "clsx";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type MouseEvent,
} from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ADMIN_SECTIONS, LEAVE_WARNING } from "./adminSections";
import { UnsavedChangesContext } from "./forms/unsavedChanges";

export function AdminLayout() {
  const location = useLocation();
  const dirty = useRef(false);
  const setDirty = useCallback((value: boolean) => {
    dirty.current = value;
  }, []);
  const isDirty = useCallback(() => dirty.current, []);
  const context = useMemo(() => ({ setDirty, isDirty }), [setDirty, isDirty]);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const current = ADMIN_SECTIONS.find((section) =>
    location.pathname.startsWith(section.to),
  );

  function guard(event: MouseEvent) {
    if (dirty.current && !window.confirm(LEAVE_WARNING)) {
      event.preventDefault();
    }
  }

  return (
    <div className="admin">
      <nav className="admin__menu" aria-label="Admin">
        <ul>
          {ADMIN_SECTIONS.map((section) => (
            <li key={section.to}>
              <NavLink
                to={section.to}
                onClick={guard}
                className={({ isActive }) =>
                  clsx("admin__link", { "admin__link--active": isActive })
                }
              >
                <section.icon size={16} aria-hidden="true" />
                {section.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <section className="admin__content">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/admin" onClick={guard}>
            Admin
          </Link>
          {current && (
            <>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{current.label}</span>
            </>
          )}
        </nav>
        <UnsavedChangesContext.Provider value={context}>
          <Outlet />
        </UnsavedChangesContext.Provider>
      </section>
    </div>
  );
}
