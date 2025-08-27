import { useState, useMemo } from "react";
import { TableColumn, SortDirection } from "./SortableFilterableTable";

export function useFilter<T>(data: T[], columns: TableColumn<T>[]) {
  const [filterText, setFilterText] = useState("");

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

  return { filterText, setFilterText, filteredData };
}

export function useSort<T>(data: T[], columns: TableColumn<T>[]) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;
    const column = columns.find((col) => col.key === sortColumn);
    if (!column) return data;
    return [...data].sort((a, b) => {
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
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      if (sortDirection === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [data, sortColumn, sortDirection, columns]);

  function handleSort(column: TableColumn<T>) {
    if (!column.sortable) return;
    if (sortColumn === column.key) {
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
  }

  function getSortIndicator(column: TableColumn<T>) {
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
  }

  return {
    sortColumn,
    sortDirection,
    sortedData,
    handleSort,
    getSortIndicator,
  };
}
