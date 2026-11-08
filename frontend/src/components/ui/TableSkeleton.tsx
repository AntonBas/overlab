import "./ui.css";
interface TableSkeletonProps {
  rows?: number;
  label?: string;
}

export function TableSkeleton({
  rows = 10,
  label = "Loading",
}: TableSkeletonProps) {
  return (
    <div
      className="table-wrap skeleton"
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
