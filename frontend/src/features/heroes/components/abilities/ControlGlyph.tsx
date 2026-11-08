import type { ControlScheme } from "../../context/controlSchemeContext";
import "../../heroes.css";

type FaceButton = "A" | "B" | "X" | "Y";
type PlayStationSymbol = "Cross" | "Circle" | "Square" | "Triangle";

const FACE_BUTTONS: readonly string[] = ["A", "B", "X", "Y"];
const PLAYSTATION_SYMBOLS: readonly string[] = [
  "Cross",
  "Circle",
  "Square",
  "Triangle",
];

function PlayStationShape({ symbol }: { symbol: PlayStationSymbol }) {
  const common = {
    fill: "none",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg
      className={`glyph glyph--ps glyph--${symbol.toLowerCase()}`}
      viewBox="0 0 16 16"
      width="18"
      height="18"
      aria-hidden="true"
    >
      {symbol === "Cross" && (
        <path
          d="M3.5 3.5l9 9M12.5 3.5l-9 9"
          {...common}
          stroke="currentColor"
        />
      )}
      {symbol === "Circle" && (
        <circle cx="8" cy="8" r="5" {...common} stroke="currentColor" />
      )}
      {symbol === "Square" && (
        <rect
          x="3.5"
          y="3.5"
          width="9"
          height="9"
          {...common}
          stroke="currentColor"
        />
      )}
      {symbol === "Triangle" && (
        <path d="M8 2.2l5.8 10H2.2z" {...common} stroke="currentColor" />
      )}
    </svg>
  );
}

function FaceButtonBadge({
  button,
  colored,
}: {
  button: FaceButton;
  colored: boolean;
}) {
  return (
    <span
      className={`glyph glyph--face glyph--${colored ? "xbox" : "plain"}-${button.toLowerCase()}`}
      aria-hidden="true"
    >
      {button}
    </span>
  );
}

export function ControlGlyph({
  scheme,
  name,
}: {
  scheme: ControlScheme;
  name: string;
}) {
  if (scheme === "PLAYSTATION" && PLAYSTATION_SYMBOLS.includes(name)) {
    return (
      <>
        <PlayStationShape symbol={name as PlayStationSymbol} />
        <span className="visually-hidden">{name}</span>
      </>
    );
  }
  if (
    (scheme === "XBOX" || scheme === "SWITCH") &&
    FACE_BUTTONS.includes(name)
  ) {
    return (
      <>
        <FaceButtonBadge
          button={name as FaceButton}
          colored={scheme === "XBOX"}
        />
        <span className="visually-hidden">{name}</span>
      </>
    );
  }
  return <>{name}</>;
}
