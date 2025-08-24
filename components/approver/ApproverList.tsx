import { Person } from "@/database/models/person.model";
import { FC } from "react";
import { useApproverSelection } from "@/app/contexts/ApproverContext";
import SortableFilterableTable, {
  TableColumn,
} from "@/ui/table/SortableFilterableTable";

type ApproverListProps = {
  personArray: Person[];
  isLoading?: boolean;
};

const ApproverList: FC<ApproverListProps> = ({
  personArray,
  isLoading = false,
}) => {
  // Use context for approver list, but preserve original rendering and props
  const { approverList } = useApproverSelection();

  // Prefer context value if available, else fallback to prop
  const list =
    approverList._tag === "Some" && Array.isArray(approverList.value)
      ? approverList.value
      : personArray;

  // Define table columns for approvers
  const columns: TableColumn<Person>[] = [
    {
      key: "firstName",
      label: "First Name",
      sortable: true,
      filterable: true,
      getValue: (person: Person) => person.firstName || "",
    },
    {
      key: "lastName",
      label: "Last Name",
      sortable: true,
      filterable: true,
      getValue: (person: Person) => person.lastName || "",
    },
  ];

  return (
    <SortableFilterableTable<Person>
      data={list}
      columns={columns}
      isLoading={isLoading && list.length === 0}
      title="Approvers"
      emptyMessage="No approvers available"
      searchPlaceholder="Search approvers by name..."
      rowKey={(person, index) =>
        person.publicId || `${person.firstName}-${person.lastName}-${index}`
      }
    />
  );
};

export default ApproverList;
