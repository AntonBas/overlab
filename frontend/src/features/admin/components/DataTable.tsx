import { useState, type ReactNode } from "react";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Pagination } from "./Pagination";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  pageSize?: number;
  emptyMessage?: string;
  searchLabel?: string;
  matches?: (row: T, query: string) => boolean;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  pageSize = 10,
  emptyMessage = "Nothing here yet.",
  searchLabel,
  matches,
}: DataTableProps<T>) {
  const [requestedPage, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const searchable = searchLabel !== undefined && matches !== undefined;
  const filtered =
    searchable && query.trim() !== ""
      ? rows.filter((row) => matches(row, query))
      : rows;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(requestedPage, totalPages - 1);

  if (rows.length === 0) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <>
      {searchable && (
        <div className="table-search">
          <input
            type="search"
            value={query}
            placeholder={searchLabel}
            aria-label={searchLabel}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
          />
          <span className="muted">
            {filtered.length} of {rows.length}
          </span>
        </div>
      )}
      {filtered.length === 0 && <EmptyState>Nothing matches.</EmptyState>}
      <div className="table-wrap" hidden={filtered.length === 0}>
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.header} scope="col">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) => (
                  <td key={column.header}>{column.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
