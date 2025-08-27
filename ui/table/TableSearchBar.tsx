import React from "react";

interface TableSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TableSearchBar: React.FC<TableSearchBarProps> = ({
  value,
  onChange,
  placeholder,
}) => (
  <div className="sortable-table-search-container">
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="sortable-table-search-input"
    />
    {value && (
      <button
        onClick={() => onChange("")}
        className="sortable-table-search-clear"
      >
        ✕
      </button>
    )}
  </div>
);

export default TableSearchBar;
