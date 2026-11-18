import clsx from "clsx";
import { formatPercent } from "../../utils/format";

interface RateBarProps {
  value: number | null;
  tone: "win" | "pick" | "ban";
  max?: number;
}

const EVEN_WIN_RATE = 50;
const WIN_RATE_SPREAD = 10;

export function RateBar({ value, tone, max = 100 }: RateBarProps) {
  if (value === null) {
    return <span className="muted">-</span>;
  }
  if (tone === "win") {
    const difference = value - EVEN_WIN_RATE;
    const half = Math.min(50, (Math.abs(difference) / WIN_RATE_SPREAD) * 50);
    const above = difference > 0;
    const below = difference < 0;
    return (
      <span className="rate-bar">
        <span
          className={clsx("rate-bar__value", {
            "rate-bar__value--above": above,
            "rate-bar__value--below": below,
          })}
        >
          {formatPercent(value)}
        </span>
        <span
          className="rate-bar__track rate-bar__track--centered"
          aria-hidden="true"
        >
          <span
            className={clsx("rate-bar__fill rate-bar__fill--centered", {
              "rate-bar__fill--win": !below,
              "rate-bar__fill--loss": below,
            })}
            style={{
              left: below ? `${50 - half}%` : "50%",
              width: `${half}%`,
            }}
          />
        </span>
      </span>
    );
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
