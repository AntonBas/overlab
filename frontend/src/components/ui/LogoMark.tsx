interface LogoMarkProps {
  size?: number;
}

export function LogoMark({ size = 64 }: LogoMarkProps) {
  return (
    <svg
      className="logo-mark"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="14" fill="#171c26" />
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
      <path
        d="M28 13v15L17 44a3 3 0 0 0 3 5h24a3 3 0 0 0 3-5L36 28V13"
        stroke="#f99e1a"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <g fill="#4f9dff">
        <rect x="24" y="41" width="4" height="6" rx="1" />
        <rect x="30" y="35" width="4" height="12" rx="1" />
        <rect x="36" y="41" width="4" height="6" rx="1" />
      </g>
    </svg>
  );
}
