import { Link } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { usePageTitle } from "../hooks/usePageTitle";
import { useNoIndex } from "../hooks/useNoIndex";

export function NotFoundPage() {
  usePageTitle("Page not found");
  useNoIndex();
  return (
    <>
      <PageHeader title="Page not found" />
      <p>
        The page you are looking for does not exist.{" "}
        <Link to="/stats">Go to the statistics</Link>.
      </p>
    </>
  );
}
