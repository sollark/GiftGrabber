/**
 * ApplicantDetails.tsx
 *
 * Purpose: React component for displaying an applicant's full name and identifying number, fetched by publicId.
 * Responsibilities:
 * - Fetch applicant data from the API using SWR
 * - Display the applicant's full name and, if available, their identifying number in the correct format
 * - Remain presentational and stateless except for data fetching
 */

import { FC } from "react";
import useSWR from "swr";
import { ExcelFormatType } from "@/types/excel.types";

/**
 * Props for ApplicantDetails component.
 * @property publicId - The applicant's public identifier
 */
export interface ApplicantDetailsProps {
  publicId: string;
}

/**
 * Fetches applicant details by publicId from the API.
 * @param publicId - The applicant's public identifier
 * @returns The applicant object as JSON
 * @throws Error if the fetch fails
 */
const fetchApplicant = async (publicId: string) => {
  const res = await fetch(`/api/applicants/${publicId}`);
  if (!res.ok) throw new Error("Failed to fetch applicant details");
  return res.json();
};

/**
 * ApplicantDetails
 * React component to display an applicant's full name and number (if available).
 * @param publicId - The applicant's public identifier
 * @returns JSX.Element with applicant info or loading/error state
 */
const ApplicantDetails: FC<ApplicantDetailsProps> = ({ publicId }) => {
  const { data: applicant, error } = useSWR(
    publicId ? [`applicant`, publicId] : null,
    () => fetchApplicant(publicId)
  );

  if (error) return <>N/A</>;
  if (!applicant) return <>Loading...</>;

  // Display only the fields relevant to the applicant's format
  let display = "N/A";
  switch (applicant.sourceFormat) {
    case ExcelFormatType.COMPLETE_EMPLOYEE:
      display = [
        applicant.firstName && `First Name: ${applicant.firstName}`,
        applicant.lastName && `Last Name: ${applicant.lastName}`,
        applicant.employee_number && `Employee #: ${applicant.employee_number}`,
        applicant.id && `ID: ${applicant.id}`,
      ]
        .filter(Boolean)
        .join(" | ");
      break;
    case ExcelFormatType.EMPLOYEE_ID_ONLY:
      display = [applicant.worker_id && `Worker ID: ${applicant.worker_id}`]
        .filter(Boolean)
        .join(" | ");
      break;
    case ExcelFormatType.PERSON_ID_ONLY:
      display = [
        applicant.person_id_number &&
          `Person ID: ${applicant.person_id_number}`,
      ]
        .filter(Boolean)
        .join(" | ");
      break;
    case ExcelFormatType.BASIC_NAME:
      display = [
        applicant.firstName && `First Name: ${applicant.firstName}`,
        applicant.lastName && `Last Name: ${applicant.lastName}`,
      ]
        .filter(Boolean)
        .join(" | ");
      break;
    default:
      display = applicant.publicId ? `Public ID: ${applicant.publicId}` : "N/A";
  }

  return <>{display || "N/A"}</>;
};

export default ApplicantDetails;
