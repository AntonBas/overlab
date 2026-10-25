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
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  pageSize = 20,
  emptyMessage = "Nothing here yet.",
}: DataTableProps<T>) {
  const [requestedPage, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(requestedPage, totalPages - 1);

  if (rows.length === 0) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  const visible = rows.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <>
      <div className="table-wrap">
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
