import { formatDateTime, formatRelativeTime } from "../../utils/format";

interface CollectedAtProps {
  value: string;
}

export function CollectedAt({ value }: CollectedAtProps) {
  return (
    <time dateTime={value} title={formatDateTime(value, true)}>
      {formatRelativeTime(value)}
    </time>
  );
}
