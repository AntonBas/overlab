import "../../admin.css";
interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }
  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="button button--ghost"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      <span className="muted">
        Page {page + 1} of {totalPages}
      </span>
      <button
        type="button"
        className="button button--ghost"
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
