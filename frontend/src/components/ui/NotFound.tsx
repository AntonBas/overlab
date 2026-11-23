import { Link } from "react-router-dom";
import { useNoIndex } from "../../hooks/useNoIndex";
import { usePageTitle } from "../../hooks/usePageTitle";
import { LogoMark } from "./LogoMark";

interface NotFoundProps {
  alert?: boolean;
}

export function NotFound({ alert = false }: NotFoundProps) {
  usePageTitle("Page not found");
  useNoIndex();
  return (
    <section className="not-found" role={alert ? "alert" : undefined}>
      <p className="not-found__code" aria-hidden="true">
        <span>4</span>
        <LogoMark size={88} />
        <span>4</span>
      </p>
      <h1>Page not found</h1>
      <p className="muted">
        We could not find that page. It may have moved, or the link is wrong.
      </p>
      <div className="not-found__actions">
        <Link className="button" to="/heroes">
          Go to heroes
        </Link>
        <Link className="button button--ghost" to="/">
          Statistics
        </Link>
      </div>
    </section>
  );
}
