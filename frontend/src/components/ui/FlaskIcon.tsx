interface FlaskIconProps {
  variant: "error" | "empty";
}

export function FlaskIcon({ variant }: FlaskIconProps) {
  return (
    <svg
      className={`flask-icon flask-icon--${variant}`}
      width="56"
      height="56"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <rect className="flask-icon__plate" width="64" height="64" rx="14" />
      <circle
        className="flask-icon__ring"
        cx="32"
        cy="32"
        r="27.5"
        strokeWidth="5"
      />
      <path
        className="flask-icon__flask"
        d="M28 13v15L17 44a3 3 0 0 0 3 5h24a3 3 0 0 0 3-5L36 28V13"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {variant === "error" && (
        <path
          className="flask-icon__crack"
          d="M22 36l6 4 4-6 5 5 5-4"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
