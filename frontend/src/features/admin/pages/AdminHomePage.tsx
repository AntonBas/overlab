import { Link } from "react-router-dom";
import { PageHeader } from "../../../components/ui/PageHeader";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { ADMIN_SECTIONS } from "../components/adminSections";

export function AdminHomePage() {
  usePageTitle("Admin");
  return (
    <>
      <PageHeader
        title="Admin"
        subtitle="Manage site content and the collector."
      />
      <ul className="admin__cards">
        {ADMIN_SECTIONS.map((section) => (
          <li key={section.to}>
            <Link className="button button--ghost" to={section.to}>
              {section.label}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
