import type { ReactNode } from "react";
import "./ui.css";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  image?: ReactNode;
  badge?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  image,
  badge,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__title">
        {image}
        <div>
          <h1>
            {title}
            {badge}
          </h1>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
