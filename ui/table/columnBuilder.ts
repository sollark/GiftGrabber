// Gift table columns (publicId and status only, no names)
import { Gift } from "@/database/models/gift.model";

// Helper to prefix columns for owner/applicant
function prefixColumns<T>(
  columns: TableColumn<T>[],
  prefix: string
): TableColumn<Gift>[] {
  return columns.map((col) => {
    // Only use key for lookup, not col.key (which is prefixed)
    const rawKey = col.key;
    return {
      key: `${prefix}${rawKey.charAt(0).toUpperCase() + rawKey.slice(1)}`,
      label: `${prefix === "owner" ? "Owner" : "Applicant"} ${col.label}`,
      sortable: col.sortable,
      filterable: col.filterable,
      width: col.width,
      // Always type for Gift
      getValue: (gift: Gift) => {
        const person = prefix === "owner" ? gift.owner : gift.applicant;
        if (!person && prefix === "applicant") {
          return "No applicant assigned";
        }
        return person ? (person as any)[rawKey] || "" : "";
      },
      render: col.render
        ? (_gift: Gift, index: number) => {
            const person = prefix === "owner" ? _gift.owner : _gift.applicant;
            if (!person && prefix === "applicant") {
              return "No applicant assigned";
            }
            return person ? (col.render as any)(person, index) : null;
          }
        : prefix === "applicant"
        ? () => "No applicant assigned"
        : undefined,
    };
  });
}

export function buildGiftTableColumns(
  ownerFormat: ExcelFormatType,
  applicantFormat?: ExcelFormatType
): TableColumn<Gift>[] {
  const baseColumns: TableColumn<Gift>[] = [
    {
      key: "publicId",
      label: "Gift ID",
      sortable: true,
      filterable: true,
      getValue: (gift) => gift.publicId,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      getValue: (gift) => (gift.applicant ? "Claimed" : "Available"),
    },
    {
      key: "publicOrderId",
      label: "Order",
      sortable: true,
      filterable: true,
      getValue: (gift) => (gift.order ? gift.order.publicId : "-"),
    },
  ];

  // Owner columns
  const ownerColumns = prefixColumns(
    buildTableColumnsByFormat(ownerFormat),
    "owner"
  );
  // Applicant columns (if any applicant exists)
  const applicantColumns = applicantFormat
    ? prefixColumns(buildTableColumnsByFormat(applicantFormat), "applicant")
    : [];

  return [...baseColumns, ...ownerColumns, ...applicantColumns];
}
import { TableColumn } from "@/ui/table/SortableFilterableTable";
import { ExcelFormatType } from "@/types/excel.types";

const formatColumnMap: Record<
  ExcelFormatType,
  Array<{ key: string; label: string }>
> = {
  [ExcelFormatType.COMPLETE_EMPLOYEE]: [
    { key: "publicId", label: "Public ID" },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "employeeId", label: "Employee ID" },
    { key: "sourceFormat", label: "Format" },
  ],
  [ExcelFormatType.BASIC_NAME]: [
    { key: "publicId", label: "Public ID" },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "sourceFormat", label: "Format" },
  ],
  [ExcelFormatType.EMPLOYEE_ID_ONLY]: [
    { key: "publicId", label: "Public ID" },
    { key: "employeeId", label: "Employee ID" },
    { key: "sourceFormat", label: "Format" },
  ],
  [ExcelFormatType.PERSON_ID_ONLY]: [
    { key: "publicId", label: "Public ID" },
    { key: "personId", label: "Person ID" },
    { key: "sourceFormat", label: "Format" },
  ],
};

export function buildTableColumnsByFormat<T = any>(
  format: ExcelFormatType
): TableColumn<T>[] {
  const columns = formatColumnMap[format] || [];
  return columns.map((col) => ({
    key: col.key,
    label: col.label,
    sortable: true,
    filterable: true,
    getValue: (item: T) => (item as any)[col.key] || "",
  }));
}
