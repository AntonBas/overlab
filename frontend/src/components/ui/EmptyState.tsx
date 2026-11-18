import { Clock, Inbox, SearchX } from "lucide-react";
import type { ReactNode } from "react";

const KIND_ICONS = {
  empty: Inbox,
  waiting: Clock,
  "no-match": SearchX,
} as const;

export type EmptyStateKind = keyof typeof KIND_ICONS;

interface EmptyStateProps {
  children: ReactNode;
  kind?: EmptyStateKind;
  icon?: ReactNode;
  title?: string;
}

export function EmptyState({
  children,
  kind = "empty",
  icon,
  title,
}: EmptyStateProps) {
  const KindIcon = KIND_ICONS[kind];
  return (
    <div className="notice notice--centered">
      <span className="notice__icon" aria-hidden="true">
        {icon ?? <KindIcon size={26} />}
      </span>
      {title && <strong>{title}</strong>}
      <div className="muted">{children}</div>
    </div>
  );
}
