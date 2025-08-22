import { Person } from "@/database/models/person.model";
import { FC } from "react";
import { useApplicantSelection } from "@/app/contexts/ApplicantContext";
import ListSkeleton from "@/components/ui/ListSkeleton";

/**
 * ApplicantList component
 * Renders a list of applicants using context as the primary source, with an optional fallback prop.
 * - Uses context for applicant list, or falls back to the provided personArray prop.
 * - Displays a simple list of applicant names.
 * - Shows loading skeleton when data is being fetched.
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
  const { applicantList } = useApplicantSelection();

  // Prefer context value if available, else fallback to prop
  const list =
    applicantList._tag === "Some" && Array.isArray(applicantList.value)
      ? applicantList.value
      : personArray;

  // Show loading skeleton when loading and no data
  if (isLoading && list.length === 0) {
    return <ListSkeleton title="Applicants" rows={4} columns={1} />;
  }

  return (
    <div>
      <h3>Applicants</h3>
      {list.length === 0 ? (
        <div className="text-gray-500 text-sm">No applicants available</div>
      ) : (
        <ul>
          {list.map((applicant: Person, index: number) => (
            <li
              key={
                applicant.publicId ||
                `${applicant.firstName}-${applicant.lastName}-${index}`
              }
            >
              {`${applicant.firstName} ${applicant.lastName}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ApplicantList;
