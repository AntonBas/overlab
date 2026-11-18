interface TableSkeletonProps {
  rows?: number;
  label?: string;
  tall?: boolean;
}

export function TableSkeleton({
  rows = 10,
  label = "Loading",
  tall = false,
}: TableSkeletonProps) {
  return (
    <div
      className={
        tall ? "table-wrap skeleton skeleton--tall" : "table-wrap skeleton"
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="visually-hidden">{label}...</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="skeleton__row" aria-hidden="true" />
      ))}
    </div>
  );
}
