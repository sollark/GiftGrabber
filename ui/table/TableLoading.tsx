import React from "react";

interface TableLoadingProps {
  title?: string;
  className?: string;
  rows?: number;
}

const TableLoading: React.FC<TableLoadingProps> = ({
  title,
  className = "",
  rows = 3,
}) => (
  <div className={`sortable-table-container ${className}`}>
    {title && <h3 className="sortable-table-title">{title}</h3>}
    <div className="sortable-table-loading">
      <div className="sortable-table-loading-title"></div>
      <div className="sortable-table-loading-rows">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="sortable-table-loading-row"></div>
        ))}
      </div>
    </div>
  </div>
);

export default TableLoading;
