import { Person } from "@/database/models/person.model";
import { FC } from "react";
import { useApplicantSelection } from "@/app/contexts/ApplicantContext";

/**
 * ApplicantList component
 * Renders a list of applicants using context as the primary source, with an optional fallback prop.
 * - Uses context for applicant list, or falls back to the provided personArray prop.
 * - Displays a simple list of applicant names.
 *
 * Props:
 *   personArray: Person[] - Optional fallback array of Person objects.
 */
type ApplicantListProps = {
  personArray: Person[];
};

const ApplicantList: FC<ApplicantListProps> = ({ personArray }) => {
  // Use context for applicant list, but preserve original rendering and props
  const { applicantList } = useApplicantSelection();

  // Prefer context value if available, else fallback to prop
  const list =
    applicantList._tag === "Some" && Array.isArray(applicantList.value)
      ? applicantList.value
      : personArray;

  return (
    <div>
      <h3>Applicants</h3>
      <ul>
        {list.map((applicant: Person) => (
          <li key={applicant._id.toString()}>
            {`${applicant.firstName} ${applicant.lastName}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ApplicantList;
