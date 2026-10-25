import clsx from "clsx";
import { formatDelta } from "../../utils/format";

interface DeltaValueProps {
  value: number | null;
  inverted?: boolean;
}

export function DeltaValue({ value, inverted = false }: DeltaValueProps) {
  if (value === null) {
    return null;
  }
  const rounded = Math.round(value * 10) / 10;
  const positive = inverted ? rounded < 0 : rounded > 0;
  const negative = inverted ? rounded > 0 : rounded < 0;
  return (
    <span
      className={clsx("delta", {
        "delta--up": positive,
        "delta--down": negative,
      })}
      title="Difference from the all-maps value"
    >
      {formatDelta(value)}
    </span>
  );
}
