import { useState } from "react";
import { humanize } from "../../utils/format";
import "./ui.css";

interface SubroleBadgeProps {
  subrole: string;
  compact?: boolean;
}

export function SubroleBadge({ subrole, compact = false }: SubroleBadgeProps) {
  const [iconFailed, setIconFailed] = useState(false);

  return (
    <span className="role-badge">
      {!iconFailed && (
        <img
          className="subrole-icon"
          src={`/images/subroles/${subrole.toLowerCase()}.svg`}
          alt=""
          width={20}
          height={20}
          onError={() => setIconFailed(true)}
        />
      )}
      {compact ? (
        <span className="visually-hidden">{humanize(subrole)}</span>
      ) : (
        humanize(subrole)
      )}
    </span>
  );
}
