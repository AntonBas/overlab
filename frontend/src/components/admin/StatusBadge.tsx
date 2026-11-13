import clsx from "clsx";
import { humanize } from "../../utils/format";

type BadgeTone = "good" | "bad" | "warning" | "info" | "neutral";

interface StatusBadgeProps {
  value: string;
  tone: BadgeTone;
}

export function StatusBadge({ value, tone }: StatusBadgeProps) {
  return (
    <span className={clsx("status-badge", `status-badge--${tone}`)}>
      {humanize(value)}
    </span>
  );
}
