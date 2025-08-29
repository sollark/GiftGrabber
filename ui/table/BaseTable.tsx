import React from "react";

/**
 * BaseTable component renders a styled table with no sorting or filtering logic.
 *
 * @template T - The type of data for each row.
 * @param columns - Array of column definitions with header and accessor.
 * @param data - Array of row data.
 * @param className - Optional additional class names for the table.
 * @returns A styled table component.
 */
export type BaseTableColumn<T> = {
  header: React.ReactNode;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
};

export interface BaseTableProps<T> {
  columns: BaseTableColumn<T>[];
  data: T[];
  className?: string;
}

export function BaseTable<T>({ columns, data, className }: BaseTableProps<T>) {
  return (
    <div
      className={`overflow-x-auto rounded border border-gray-200 bg-white ${
        className ?? ""
      }`}
    >
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-4 py-2 text-left font-semibold text-gray-700 ${
                  col.className ?? ""
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-4 text-center text-gray-400"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50">
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-4 py-2 ${col.className ?? ""}`}
                  >
                    {typeof col.accessor === "function"
                      ? col.accessor(row)
                      : (row[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
