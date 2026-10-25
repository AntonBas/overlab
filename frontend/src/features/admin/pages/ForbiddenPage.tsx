import { Link } from "react-router-dom";
import { PageHeader } from "../../../components/ui/PageHeader";
import { usePageTitle } from "../../../hooks/usePageTitle";

export function ForbiddenPage() {
  usePageTitle("Access denied");
  return (
    <>
      <PageHeader title="Access denied" />
      <p>You do not have permission to open this page.</p>
      <p>
        <Link to="/">Back to the site</Link>
      </p>
    </>
  );
}
