import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface SectionLinkProps {
  to: string;
  children: ReactNode;
}

export function SectionLink({ to, children }: SectionLinkProps) {
  return (
    <Link className="button button--ghost button--compact section-link" to={to}>
      {children}
    </Link>
  );
}
