# Sortable and Filterable Table Component

This document explains how to use the `SortableFilterableTable` component that has been created for your GiftGrabber application.

## Overview

The `SortableFilterableTable` component is a reusable, type-safe table component that provides:

- ✅ **Sorting**: Click column headers to sort ascending, descending, or clear sort
- ✅ **Filtering**: Global search across all filterable columns
- ✅ **Loading States**: Built-in loading skeleton
- ✅ **Responsive Design**: Horizontal scrolling on small screens
- ✅ **Type Safety**: Full TypeScript support with generics
- ✅ **Customizable Rendering**: Custom render functions for complex data
- ✅ **Performance**: Optimized with React.useMemo for sorting and filtering

## Basic Usage

```tsx
import SortableFilterableTable, {
  TableColumn,
} from "@/components/ui/SortableFilterableTable";

// Define your columns
const columns: TableColumn<MyDataType>[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    filterable: true,
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    filterable: true,
    render: (item) => (
      <span className={item.active ? "text-green-600" : "text-red-600"}>
        {item.active ? "Active" : "Inactive"}
      </span>
    ),
  },
];

// Use the table
<SortableFilterableTable
  data={myData}
  columns={columns}
  title="My Data"
  searchPlaceholder="Search..."
/>;
```

## Column Configuration

### TableColumn Interface

```tsx
interface TableColumn<T = any> {
  key: string; // Property key for the data
  label: string; // Display name for the column header
  sortable?: boolean; // Enable sorting for this column
  filterable?: boolean; // Include this column in global search
  width?: string; // CSS width value (e.g., '25%', '200px')
  getValue?: (item: T) => string | number; // Custom value extractor for sorting/filtering
  render?: (item: T, index: number) => React.ReactNode; // Custom rendering function
}
```

### Column Options

#### Basic Column

```tsx
{
  key: 'firstName',
  label: 'First Name',
  sortable: true,
  filterable: true,
}
```

#### Custom Rendering

```tsx
{
  key: 'status',
  label: 'Status',
  sortable: true,
  filterable: true,
  render: (item) => (
    <span className={`badge ${item.active ? 'badge-success' : 'badge-danger'}`}>
      {item.active ? 'Active' : 'Inactive'}
    </span>
  ),
}
```

#### Complex Data with getValue

```tsx
{
  key: 'user',
  label: 'User Name',
  sortable: true,
  filterable: true,
  getValue: (item) => `${item.user.firstName} ${item.user.lastName}`,
  render: (item) => (
    <div className="flex items-center">
      <img src={item.user.avatar} className="w-8 h-8 rounded-full mr-2" />
      <span>{item.user.firstName} {item.user.lastName}</span>
    </div>
  ),
}
```

#### Action Column

```tsx
{
  key: 'actions',
  label: 'Actions',
  sortable: false,
  filterable: false,
  render: (item, index) => (
    <div className="space-x-2">
      <button onClick={() => editItem(item)}>Edit</button>
      <button onClick={() => deleteItem(item)}>Delete</button>
    </div>
  ),
}
```

## Props

### SortableFilterableTableProps

```tsx
interface SortableFilterableTableProps<T = any> {
  data: T[]; // Array of data to display
  columns: TableColumn<T>[]; // Column definitions
  isLoading?: boolean; // Show loading state
  emptyMessage?: string; // Message when no data
  title?: string; // Optional table title
  searchPlaceholder?: string; // Search input placeholder
  className?: string; // Additional CSS classes
  rowKey?: (item: T, index: number) => string; // Custom row key generator
}
```

## Updated Components

The following components have been updated to use the new table:

### 1. GiftList Component

- **Location**: `/components/gift/GiftList.tsx`
- **Features**: Sortable by owner, status, and claimant
- **Search**: Filter by owner name, status, or claimant name
- **Columns**: Owner, Status, Claimed By

### 2. ApplicantList Component

- **Location**: `/components/applicant/ApplicantList.tsx`
- **Features**: Sortable by first name, last name, full name
- **Search**: Filter by any part of the name
- **Columns**: First Name, Last Name, Full Name

## Advanced Examples

### Example 1: User Management Table

```tsx
const userColumns: TableColumn<User>[] = [
  {
    key: "avatar",
    label: "",
    sortable: false,
    filterable: false,
    width: "60px",
    render: (user) => (
      <img src={user.avatar} className="w-10 h-10 rounded-full" />
    ),
  },
  {
    key: "name",
    label: "Name",
    sortable: true,
    filterable: true,
    getValue: (user) => `${user.firstName} ${user.lastName}`,
    render: (user) => (
      <div>
        <div className="font-medium">
          {user.firstName} {user.lastName}
        </div>
        <div className="text-sm text-gray-500">{user.email}</div>
      </div>
    ),
  },
  {
    key: "role",
    label: "Role",
    sortable: true,
    filterable: true,
    render: (user) => (
      <span className={`badge ${getRoleColor(user.role)}`}>{user.role}</span>
    ),
  },
  {
    key: "lastLogin",
    label: "Last Login",
    sortable: true,
    filterable: false,
    getValue: (user) => user.lastLogin.toISOString(),
    render: (user) => (
      <span className="text-sm">{formatDistanceToNow(user.lastLogin)} ago</span>
    ),
  },
];
```

### Example 2: Order Management Table

```tsx
const orderColumns: TableColumn<Order>[] = [
  {
    key: "id",
    label: "Order ID",
    sortable: true,
    filterable: true,
    width: "120px",
    render: (order) => (
      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
        {order.publicId}
      </code>
    ),
  },
  {
    key: "applicant",
    label: "Applicant",
    sortable: true,
    filterable: true,
    getValue: (order) =>
      `${order.applicant.firstName} ${order.applicant.lastName}`,
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    filterable: true,
    render: (order) => (
      <span className={`status-badge status-${order.status.toLowerCase()}`}>
        {order.status}
      </span>
    ),
  },
  {
    key: "total",
    label: "Total",
    sortable: true,
    filterable: false,
    getValue: (order) => order.total,
    render: (order) => (
      <span className="font-mono">${order.total.toFixed(2)}</span>
    ),
  },
];
```

## Styling

The table uses Tailwind CSS classes and follows your existing design system. Key classes:

- **Table Container**: `overflow-x-auto` for responsive scrolling
- **Table**: `min-w-full border-collapse bg-white border border-gray-200 rounded-lg`
- **Headers**: `bg-gray-50` with hover effects for sortable columns
- **Rows**: Alternating hover states with `hover:bg-gray-50`
- **Loading**: Pulse animations for skeleton loading

### Custom Styling

You can add custom styles by:

1. **Passing className prop**:

```tsx
<SortableFilterableTable
  className="my-custom-table"
  // ... other props
/>
```

2. **Custom CSS classes in render functions**:

```tsx
render: (item) => <span className="my-custom-cell-style">{item.value}</span>;
```

## Performance Tips

1. **Use getValue for complex sorting**: When sorting by computed values, provide a `getValue` function
2. **Memoize expensive renders**: Use `React.useMemo` in custom render functions if needed
3. **Optimize rowKey**: Provide a stable `rowKey` function for better React reconciliation
4. **Limit filterable columns**: Only make columns filterable if users actually need to search them

## Migration Guide

If you have existing table components, here's how to migrate:

### Before

```tsx
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    {data.map((item) => (
      <tr key={item.id}>
        <td>{item.name}</td>
        <td>{item.status}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### After

```tsx
const columns = [
  { key: "name", label: "Name", sortable: true, filterable: true },
  { key: "status", label: "Status", sortable: true, filterable: true },
];

<SortableFilterableTable
  data={data}
  columns={columns}
  rowKey={(item) => item.id}
/>;
```

## Troubleshooting

### Common Issues

1. **TypeScript errors with getValue**: Ensure getValue returns `string | number`, handle undefined values
2. **Missing sort indicators**: Check that `sortable: true` is set on columns
3. **Search not working**: Verify `filterable: true` is set on searchable columns
4. **Performance issues**: Use `getValue` for complex data extraction instead of in-render calculations

### Debug Tips

1. Add `console.log` in render functions to debug rendering issues
2. Use React DevTools to inspect component state
3. Check browser console for TypeScript errors
4. Verify data structure matches column keys

## Future Enhancements

Potential improvements that could be added:

- Column resizing
- Column reordering
- Export to CSV/Excel
- Pagination for large datasets
- Multiple column sorting
- Advanced filters (date ranges, multi-select)
- Saved filter presets
- Column visibility toggle
