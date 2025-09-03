import { Person } from "@/database/models/person.model";
import { FC } from "react";
import { useApplicantList } from "@/app/contexts/ApplicantContext";
import SortableFilterableTable from "@/ui/table/SortableFilterableTable";
import { buildTableColumnsByFormat } from "@/ui/table/columnBuilder";
import { useErrorHandler } from "@/components/ErrorBoundary";

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
  const { handleError, errorCount } = useErrorHandler("ApplicantList");

  /**
   * Get applicant list from context, fallback to prop if context is unavailable.
   * @returns Person[]
   */
  const applicantList = useApplicantList();
  const list =
    Array.isArray(applicantList) && applicantList.length > 0
      ? applicantList
      : personArray;

  // Track context access issues
  if (!list.length && personArray.length === 0) {
    const error = new Error(
      "No applicant data available from context or props"
    );
    handleError(error);
  }

  // Use column builder based on format (assume all persons have same format)
  const format = list.length > 0 ? list[0].sourceFormat : undefined;
  const columns = format ? buildTableColumnsByFormat(format) : [];

  return (
    <SortableFilterableTable<Person>
      data={list}
      columns={columns}
      isLoading={isLoading && list.length === 0}
      title="Applicants"
      emptyMessage={
        errorCount > 0
          ? `No applicants available (${errorCount} data loading error${
              errorCount > 1 ? "s" : ""
            })`
          : "No applicants available"
      }
      searchPlaceholder="Search applicants by name..."
      rowKey={(person) => person.publicId}
    />
  );
};

export default ApplicantList;
