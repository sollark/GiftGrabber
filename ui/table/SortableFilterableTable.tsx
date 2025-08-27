/**
 * SortableFilterableTable.tsx
 *
 * Purpose: Provides a highly modular, reusable, and type-safe table component for rendering, sorting, and filtering tabular data in React applications.
 *
 * Main Responsibilities:
 * - Orchestrates data display, sorting, filtering, and UI composition for tabular data.
 * - Delegates sorting and filtering logic to hooks, and UI elements to subcomponents.
 * - Supports custom rendering, loading states, and flexible configuration.
 *
 * Architectural Role:
 * - Acts as a UI composition layer, abstracting common table behaviors into composable components and hooks.
 * - Designed for extensibility, separation of concerns, and performance via React hooks and memoization.
 */

import React from "react";
import "./SortableFilterableTable.css";

import { useSort, useFilter } from "./useSortAndFilter";
import TableSearchBar from "./TableSearchBar";
import TableLoading from "./TableLoading";

export type SortDirection = "asc" | "desc" | null;

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
  getValue?: (item: T) => string | number;
  width?: string;
}

export interface SortableFilterableTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  title?: string;
  searchPlaceholder?: string;
  className?: string;
  rowKey?: (item: T, index: number) => string;
}

/**
 * SortableFilterableTable - A reusable table component with sorting and filtering capabilities
 *
 * Features:
 * - Global search filter across all filterable columns
 * - Column-based sorting (asc/desc/none)
 * - Customizable column rendering
 * - Loading state support
 * - Responsive design
 * - Type-safe with generics
 *
 * @param data - Array of data items to display
 * @param columns - Column definitions with rendering and behavior options
 * @param isLoading - Whether data is currently loading
 * @param emptyMessage - Message to show when no data is available
 * @param title - Optional table title
 * @param searchPlaceholder - Placeholder text for search input
 * @param className - Additional CSS classes
 * @param rowKey - Function to generate unique keys for table rows
 *
 * @returns {JSX.Element} The rendered table UI.
 */

function SortableFilterableTable<T = any>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "No data available",
  title,
  searchPlaceholder = "Search...",
  className = "",
  rowKey,
}: SortableFilterableTableProps<T>) {
  const { filterText, setFilterText, filteredData } = useFilter(data, columns);
  const { sortedData, handleSort, getSortIndicator } = useSort(
    filteredData,
    columns
  );

  // Default row key generator
  const getRowKey = React.useMemo(() => {
    if (rowKey) return rowKey;
    return (item: T, index: number) => {
      const asAny = item as any;
      return asAny.publicId || asAny._id || asAny.id || `row-${index}`;
    };
  }, [rowKey]);

  /**
   * getRowKey (internal helper)
   *
   * Generates a unique key for each table row, using a custom rowKey function if provided,
   * or falling back to common ID fields or the row index.
   *
   * @param {T} item - The data item for the row.
   * @param {number} index - The index of the row.
   * @returns {string} Unique key for the row.
   * @sideeffects None
   * @notes Ensures React key stability for dynamic data.
   */

  if (isLoading) {
    return <TableLoading title={title} className={className} />;
  }

  return (
    <div className={`sortable-table-container ${className}`}>
      {/* Header */}
      <div className="sortable-table-header">
        {title && <h3 className="sortable-table-title">{title}</h3>}
        {columns.some((col) => col.filterable) && (
          <TableSearchBar
            value={filterText}
            onChange={setFilterText}
            placeholder={searchPlaceholder}
          />
        )}
      </div>

      {/* Table */}
      {sortedData.length === 0 ? (
        <div className="sortable-table-empty">
          {filterText ? `No results found for "${filterText}"` : emptyMessage}
        </div>
      ) : (
        <div className="sortable-table-wrapper">
          <table className="sortable-table">
            <thead>
              <tr className="sortable-table-header-row">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`sortable-table-header-cell ${
                      column.sortable
                        ? "sortable-table-header-cell-sortable"
                        : ""
                    }`}
                    style={{
                      width: column.width,
                      cursor: column.sortable ? "pointer" : "default",
                    }}
                    onClick={() => handleSort(column)}
                  >
                    <div className="sortable-table-header-content">
                      {column.label}
                      {getSortIndicator(column)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <tr
                  key={getRowKey(item, index)}
                  className="sortable-table-body-row"
                >
                  {columns.map((column) => (
                    <td key={column.key} className="sortable-table-body-cell">
                      {column.render
                        ? column.render(item, index)
                        : String((item as any)[column.key] || "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results count */}
      {sortedData.length > 0 && (
        <div className="sortable-table-results">
          Showing {sortedData.length} of {data.length}{" "}
          {data.length === 1 ? "item" : "items"}
          {filterText && ` matching "${filterText}"`}
        </div>
      )}
    </div>
  );
}

export default SortableFilterableTable;
