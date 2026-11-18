import type { ReactNode } from "react";
import { FlaskIcon } from "./FlaskIcon";

interface EmptyStateProps {
  children: ReactNode;
  icon?: ReactNode;
  title?: string;
}

export function EmptyState({ children, icon, title }: EmptyStateProps) {
  return (
    <div className="notice notice--centered">
      {icon ? (
        <span className="notice__icon" aria-hidden="true">
          {icon}
        </span>
      ) : (
        <FlaskIcon variant="empty" />
      )}
      {title && <strong>{title}</strong>}
      <div className="muted">{children}</div>
    </div>
  );
}
