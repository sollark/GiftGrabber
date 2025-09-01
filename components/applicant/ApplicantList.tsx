import { Person } from "@/database/models/person.model";
import { FC } from "react";
import { useApplicantList } from "@/app/contexts/ApplicantContext";
import SortableFilterableTable, {
  TableColumn,
} from "@/ui/table/SortableFilterableTable";

/**
 * ApplicantList component
 * Renders a sortable and filterable list of applicants using context as the primary source, with an optional fallback prop.
 * - Uses context for applicant list, or falls back to the provided personArray prop.
 * - Displays applicants in a searchable, sortable table format.
 * - Shows loading state when data is being fetched.
 *
 * Props:
 *   personArray: Person[] - Optional fallback array of Person objects.
 *   isLoading: boolean - Whether data is currently being loaded.
 */
type ApplicantListProps = {
  personArray: Person[];
  isLoading?: boolean;
};

const ApplicantList: FC<ApplicantListProps> = ({
  personArray,
  isLoading = false,
}) => {
  // Use context for applicant list, but preserve original rendering and props
  const applicantList = useApplicantList();

  // Prefer context value if available, else fallback to prop
  const list =
    applicantList._tag === "Some" && Array.isArray(applicantList.value)
      ? applicantList.value
      : personArray;

  // Define table columns for applicants
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
      title="Applicants"
      emptyMessage="No applicants available"
      searchPlaceholder="Search applicants by name..."
      rowKey={(person, index) =>
        person.publicId || `${person.firstName}-${person.lastName}-${index}`
      }
    />
  );
};

export default ApplicantList;
