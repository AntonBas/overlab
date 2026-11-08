import clsx from "clsx";
import { formatPercent } from "../../utils/format";
import "./ui.css";

interface RateBarProps {
  value: number | null;
  tone: "win" | "pick" | "ban";
  max?: number;
}

export function RateBar({ value, tone, max = 100 }: RateBarProps) {
  if (value === null) {
    return <span className="muted">-</span>;
  }
  const width = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <span className="rate-bar">
      <span className="rate-bar__value">{formatPercent(value)}</span>
      <span className="rate-bar__track" aria-hidden="true">
        <span
          className={clsx("rate-bar__fill", `rate-bar__fill--${tone}`)}
          style={{ width: `${width}%` }}
        />
      </span>
    </span>
  );
}
