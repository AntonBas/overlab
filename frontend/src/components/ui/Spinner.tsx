interface SpinnerProps {
  label?: string;
  page?: boolean;
}

export function Spinner({ label = "Loading", page = false }: SpinnerProps) {
  return (
    <div
      className={page ? "spinner spinner--page" : "spinner"}
      role="status"
      aria-live="polite"
    >
      <span className="spinner__dot" aria-hidden="true" />
      <span>{label}...</span>
    </div>
  );
}
