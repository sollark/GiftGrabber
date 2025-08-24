import React, { useState, useMemo } from "react";
import "./SortableFilterableTable.css";

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
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filterText, setFilterText] = useState("");

  // Default row key generator
  const getRowKey = useMemo(() => {
    if (rowKey) return rowKey;
    return (item: T, index: number) => {
      // Try to use common ID fields, fallback to index
      const asAny = item as any;
      return asAny.publicId || asAny._id || asAny.id || `row-${index}`;
    };
  }, [rowKey]);

  // Filter data based on search text
  const filteredData = useMemo(() => {
    if (!filterText.trim()) return data;

    const searchLower = filterText.toLowerCase();
    return data.filter((item) => {
      return columns.some((column) => {
        if (!column.filterable) return false;

        let value: string;
        if (column.getValue) {
          value = String(column.getValue(item));
        } else {
          const asAny = item as any;
          value = String(asAny[column.key] || "");
        }

        return value.toLowerCase().includes(searchLower);
      });
    });
  }, [data, filterText, columns]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    const column = columns.find((col) => col.key === sortColumn);
    if (!column) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (column.getValue) {
        aValue = column.getValue(a);
        bValue = column.getValue(b);
      } else {
        const asAnyA = a as any;
        const asAnyB = b as any;
        aValue = asAnyA[column.key] || "";
        bValue = asAnyB[column.key] || "";
      }

      // Handle different data types
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      // String comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortDirection === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [filteredData, sortColumn, sortDirection, columns]);

  // Handle column header click for sorting
  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable) return;

    if (sortColumn === column.key) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column.key);
      setSortDirection("asc");
    }
  };

  // Get sort indicator for column headers
  const getSortIndicator = (column: TableColumn<T>) => {
    if (!column.sortable) return null;
    if (sortColumn !== column.key) {
      return (
        <span className="sortable-table-sort-indicator sortable-table-sort-indicator-default">
          ↕
        </span>
      );
    }
    if (sortDirection === "asc") {
      return (
        <span className="sortable-table-sort-indicator sortable-table-sort-indicator-active">
          ↑
        </span>
      );
    }
    if (sortDirection === "desc") {
      return (
        <span className="sortable-table-sort-indicator sortable-table-sort-indicator-active">
          ↓
        </span>
      );
    }
    return (
      <span className="sortable-table-sort-indicator sortable-table-sort-indicator-default">
        ↕
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className={`sortable-table-container ${className}`}>
        {title && <h3 className="sortable-table-title">{title}</h3>}
        <div className="sortable-table-loading">
          <div className="sortable-table-loading-title"></div>
          <div className="sortable-table-loading-rows">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="sortable-table-loading-row"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`sortable-table-container ${className}`}>
      {/* Header */}
      <div className="sortable-table-header">
        {title && <h3 className="sortable-table-title">{title}</h3>}

        {/* Search filter */}
        {columns.some((col) => col.filterable) && (
          <div className="sortable-table-search-container">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="sortable-table-search-input"
            />
            {filterText && (
              <button
                onClick={() => setFilterText("")}
                className="sortable-table-search-clear"
              >
                ✕
              </button>
            )}
          </div>
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
