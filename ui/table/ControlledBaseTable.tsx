import React, { useState, useCallback } from "react";
import { BaseTable, BaseTableColumn } from "./BaseTable";

/**
 * ControlledBaseTable is a generic, controlled table component that manages its own data state
 * and provides add/remove item functionality. It wraps BaseTable and exposes callbacks for item changes.
 *
 * @template T - The type of data for each row.
 * @param initialData - The initial array of items.
 * @param columns - Array of column definitions with header and accessor.
 * @param onAdd - Optional callback when an item is added.
 * @param onRemove - Optional callback when an item is removed.
 * @param className - Optional additional class names for the table.
 */
export interface ControlledBaseTableProps<T> {
  initialData: T[];
  columns: BaseTableColumn<T>[];
  onAdd?: (item: T, newData: T[]) => void;
  onRemove?: (item: T, newData: T[]) => void;
  className?: string;
}

export function ControlledBaseTable<T>({
  initialData,
  columns,
  onAdd,
  onRemove,
  className,
}: ControlledBaseTableProps<T>) {
  const [data, setData] = useState<T[]>(initialData);

  const addItem = useCallback(
    (item: T) => {
      setData((prev) => {
        const newData = [...prev, item];
        onAdd?.(item, newData);
        return newData;
      });
    },
    [onAdd]
  );

  const removeItem = useCallback(
    (item: T) => {
      setData((prev) => {
        const newData = prev.filter((i) => i !== item);
        onRemove?.(item, newData);
        return newData;
      });
    },
    [onRemove]
  );

  return <BaseTable columns={columns} data={data} className={className} />;
}
