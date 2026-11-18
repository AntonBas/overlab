import { useState } from "react";
import { humanize } from "../../utils/format";

interface SubroleBadgeProps {
  subrole: string;
}

export function SubroleBadge({ subrole }: SubroleBadgeProps) {
  const iconUrl = `/images/subroles/${subrole.toLowerCase()}.svg`;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <span className="role-badge">
      {failedUrl !== iconUrl && (
        <img
          className="subrole-icon"
          src={iconUrl}
          alt=""
          width={20}
          height={20}
          onError={() => setFailedUrl(iconUrl)}
        />
      )}
      {humanize(subrole)}
    </span>
  );
}
