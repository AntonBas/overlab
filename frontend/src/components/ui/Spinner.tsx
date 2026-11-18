import { useEffect, useState } from "react";
import {
  SPINNER_APPEARS_AFTER_MS,
  isContinuingSpinner,
  phaseOffset,
  registerSpinner,
} from "./spinnerTiming";

const RING_PERIOD_MS = 1400;
const BAR_PERIOD_MS = 1000;
const BAR_STAGGER_MS = [0, 150, 300];
const BAR_PROPS = [
  { x: 24, y: 41, height: 6 },
  { x: 30, y: 35, height: 12 },
  { x: 36, y: 41, height: 6 },
];

interface SpinnerProps {
  label?: string;
  page?: boolean;
}

export function Spinner({ label = "Loading", page = false }: SpinnerProps) {
  const size = page ? 80 : 24;
  const [continuing] = useState(() => isContinuingSpinner());
  const [now] = useState(() => Date.now());

  useEffect(() => registerSpinner(), []);

  return (
    <div
      className={page ? "spinner spinner--page" : "spinner"}
      role="status"
      aria-live="polite"
      style={
        continuing
          ? { animationDuration: "0s", animationDelay: "0s" }
          : { animationDelay: `${SPINNER_APPEARS_AFTER_MS}ms` }
      }
    >
      <svg
        className="spinner__logo"
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="14" fill="#171c26" />
        <g
          className="spinner__ring"
          style={{ animationDelay: phaseOffset(RING_PERIOD_MS, 0, now) }}
        >
          <circle
            cx="32"
            cy="32"
            r="27.5"
            stroke="#e8ecf3"
            strokeWidth="5"
            strokeDasharray="140.8 32"
            transform="rotate(-56.7 32 32)"
          />
          <circle
            cx="32"
            cy="32"
            r="27.5"
            stroke="#f99e1a"
            strokeWidth="5"
            strokeDasharray="24 148.8"
            transform="rotate(-115 32 32)"
          />
        </g>
        <path
          d="M28 13v15L17 44a3 3 0 0 0 3 5h24a3 3 0 0 0 3-5L36 28V13"
          stroke="#f99e1a"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <g fill="#4f9dff">
          {BAR_PROPS.map((bar, index) => (
            <rect
              key={bar.x}
              className="spinner__bar"
              style={{
                animationDelay: phaseOffset(
                  BAR_PERIOD_MS,
                  BAR_STAGGER_MS[index],
                  now,
                ),
              }}
              x={bar.x}
              y={bar.y}
              width="4"
              height={bar.height}
              rx="1"
            />
          ))}
        </g>
      </svg>
      <span>{label}...</span>
    </div>
  );
}
