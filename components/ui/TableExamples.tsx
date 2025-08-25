import React from "react";
import SortableFilterableTable, {
  TableColumn,
} from "@/ui/table/SortableFilterableTable";
import { Person } from "@/database/models/person.model";
import { Gift } from "@/database/models/gift.model";

/**
 * Examples showing how to use the SortableFilterableTable component
 * with different data types and configurations
 */

// Example 1: Simple Person List with Basic Columns
export const PersonTableExample: React.FC<{ people: Person[] }> = ({
  people,
}) => {
  const columns: TableColumn<Person>[] = [
    {
      key: "firstName",
      label: "First Name",
      sortable: true,
      filterable: true,
    },
    {
      key: "lastName",
      label: "Last Name",
      sortable: true,
      filterable: true,
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      filterable: true,
      render: (person: Person) => (
        <a
          href={`mailto:${(person as any).email}`}
          className="text-blue-600 hover:underline"
        >
          {(person as any).email || "N/A"}
        </a>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      filterable: false,
      render: (person: Person, index: number) => (
        <div className="space-x-2">
          <button
            className="text-blue-600 hover:underline text-sm"
            onClick={() => console.log("Edit person:", person)}
          >
            Edit
          </button>
          <button
            className="text-red-600 hover:underline text-sm"
            onClick={() => console.log("Delete person:", person)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <SortableFilterableTable<Person>
      data={people}
      columns={columns}
      title="People"
      searchPlaceholder="Search by name or email..."
    />
  );
};

// Example 2: Advanced Gift Table with Custom Rendering
export const AdvancedGiftTableExample: React.FC<{ gifts: Gift[] }> = ({
  gifts,
}) => {
  const columns: TableColumn<Gift>[] = [
    {
      key: "owner",
      label: "Gift Owner",
      sortable: true,
      filterable: true,
      width: "25%",
      getValue: (gift: Gift) =>
        gift.owner
          ? `${gift.owner.firstName} ${gift.owner.lastName}`
          : "Unknown",
      render: (gift: Gift) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-800">
              {gift.owner && gift.owner.firstName
                ? gift.owner.firstName.charAt(0)
                : "?"}
            </span>
          </div>
          <span>
            {gift.owner
              ? `${gift.owner.firstName || ""} ${
                  gift.owner.lastName || ""
                }`.trim() || "Unknown Owner"
              : "Unknown Owner"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      width: "20%",
      getValue: (gift: Gift) => (gift.applicant ? "Claimed" : "Available"),
      render: (gift: Gift) => (
        <div className="flex items-center">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              gift.applicant ? "bg-red-500" : "bg-green-500"
            }`}
          ></div>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              gift.applicant
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {gift.applicant ? "Claimed" : "Available"}
          </span>
        </div>
      ),
    },
    {
      key: "applicant",
      label: "Claimed By",
      sortable: true,
      filterable: true,
      width: "25%",
      getValue: (gift: Gift) =>
        gift.applicant
          ? `${gift.applicant.firstName} ${gift.applicant.lastName}`
          : "",
      render: (gift: Gift) => (
        <div>
          {gift.applicant ? (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {gift.applicant.firstName
                    ? gift.applicant.firstName.charAt(0)
                    : "?"}
                </span>
              </div>
              <span className="text-sm">
                {`${gift.applicant.firstName || ""} ${
                  gift.applicant.lastName || ""
                }`.trim() || "Unknown"}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">Not claimed</span>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      filterable: false,
      width: "15%",
      getValue: (gift: Gift) => (gift as any).createdAt || "",
      render: (gift: Gift) => (
        <span className="text-sm text-gray-500">
          {(gift as any).createdAt
            ? new Date((gift as any).createdAt).toLocaleDateString()
            : "Unknown"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      filterable: false,
      width: "15%",
      render: (gift: Gift) => (
        <div className="flex space-x-1">
          <button
            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            onClick={() => console.log("View gift:", gift)}
          >
            View
          </button>
          {!gift.applicant && (
            <button
              className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
              onClick={() => console.log("Claim gift:", gift)}
            >
              Claim
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <SortableFilterableTable<Gift>
      data={gifts}
      columns={columns}
      title="Gift Management"
      searchPlaceholder="Search gifts by owner, status, or claimant..."
      className="gift-table"
    />
  );
};

// Example 3: Minimal Configuration
export const MinimalTableExample: React.FC<{ data: any[] }> = ({ data }) => {
  const columns: TableColumn[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      filterable: true,
    },
    {
      key: "value",
      label: "Value",
      sortable: true,
      filterable: false,
    },
  ];

  return (
    <SortableFilterableTable
      data={data}
      columns={columns}
      emptyMessage="No data to display"
    />
  );
};

// Example 4: Table with Custom Row Keys and Complex Data
export const ComplexDataTableExample: React.FC = () => {
  const complexData = [
    {
      id: 1,
      user: { name: "John Doe", role: "Admin" },
      lastLogin: new Date(),
      active: true,
    },
    {
      id: 2,
      user: { name: "Jane Smith", role: "User" },
      lastLogin: new Date(),
      active: false,
    },
    {
      id: 3,
      user: { name: "Bob Johnson", role: "Manager" },
      lastLogin: new Date(),
      active: true,
    },
  ];

  const columns: TableColumn[] = [
    {
      key: "user.name",
      label: "User Name",
      sortable: true,
      filterable: true,
      getValue: (item) => item.user.name,
      render: (item) => (
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              item.active ? "bg-green-500" : "bg-gray-300"
            }`}
          ></div>
          <span className={item.active ? "text-gray-900" : "text-gray-500"}>
            {item.user.name}
          </span>
        </div>
      ),
    },
    {
      key: "user.role",
      label: "Role",
      sortable: true,
      filterable: true,
      getValue: (item) => item.user.role,
      render: (item) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            item.user.role === "Admin"
              ? "bg-purple-100 text-purple-800"
              : item.user.role === "Manager"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {item.user.role}
        </span>
      ),
    },
    {
      key: "lastLogin",
      label: "Last Login",
      sortable: true,
      filterable: false,
      getValue: (item) => item.lastLogin.toISOString(),
      render: (item) => (
        <span className="text-sm text-gray-600">
          {item.lastLogin.toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "active",
      label: "Status",
      sortable: true,
      filterable: true,
      getValue: (item) => (item.active ? "Active" : "Inactive"),
      render: (item) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            item.active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {item.active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <SortableFilterableTable
      data={complexData}
      columns={columns}
      title="User Management"
      searchPlaceholder="Search users..."
      rowKey={(item) => `user-${item.id}`}
    />
  );
};

// LoggerDemo has been moved to examples/LoggerExamples.tsx

export default {
  PersonTableExample,
  AdvancedGiftTableExample,
  MinimalTableExample,
  ComplexDataTableExample,
};
