import React from "react";

interface ListSkeletonProps {
  rows?: number;
  title?: string;
  columns?: number;
}

/**
 * ListSkeleton component provides loading placeholders for list components.
 * Shows animated skeleton rows to improve perceived performance during data loading.
 * Uses React's built-in rendering optimizations without React.memo.
 *
 * @param rows - Number of skeleton rows to display (default: 3)
 * @param title - Optional title to show above skeleton rows
 * @param columns - Number of columns per row (default: 2)
 * @returns JSX.Element with animated skeleton placeholders
 */
const ListSkeleton: React.FC<ListSkeletonProps> = ({
  rows = 3,
  title,
  columns = 2,
}) => {
  // Memoized skeleton rows for performance
  const skeletonRows = React.useMemo(
    () =>
      Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={`h-4 bg-gray-200 rounded ${
                colIndex === 0 ? "flex-1" : "w-20"
              }`}
            ></div>
          ))}
        </div>
      )),
    [rows, columns]
  );
  return (
    <div className="animate-pulse">
      {title && <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>}
      <div className="space-y-3">{skeletonRows}</div>
    </div>
  );
};

// Add display name for debugging
ListSkeleton.displayName = "ListSkeleton";

export default ListSkeleton;
