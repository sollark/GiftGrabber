import React, { useState, useMemo } from "react";
import { Person } from "@/database/models/person.model";
import { Gift } from "@/database/models/gift.model";

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
      return <span className="text-gray-400 ml-1">↕</span>;
    }
    if (sortDirection === "asc") {
      return <span className="text-blue-600 ml-1">↑</span>;
    }
    if (sortDirection === "desc") {
      return <span className="text-blue-600 ml-1">↓</span>;
    }
    return <span className="text-gray-400 ml-1">↕</span>;
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {title && <h3 className="text-lg font-medium">{title}</h3>}
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {title && <h3 className="text-lg font-medium">{title}</h3>}

        {/* Search filter */}
        {columns.some((col) => col.filterable) && (
          <div className="relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {filterText && (
              <button
                onClick={() => setFilterText("")}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      {sortedData.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          {filterText ? `No results found for "${filterText}"` : emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`text-left py-3 px-4 font-medium text-gray-900 border-b border-gray-200 ${
                      column.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                    }`}
                    style={{ width: column.width }}
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center">
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
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  {columns.map((column) => (
                    <td key={column.key} className="py-3 px-4">
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
        <div className="text-sm text-gray-500">
          Showing {sortedData.length} of {data.length}{" "}
          {data.length === 1 ? "item" : "items"}
          {filterText && ` matching "${filterText}"`}
        </div>
      )}
    </div>
  );
}

export default SortableFilterableTable;
