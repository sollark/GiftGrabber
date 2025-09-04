import { excelFileToPersonListSafe } from "@/utils/excel_utils";
import { Result } from "@/utils/fp";
import { NewPerson } from "@/types/common.types";
import logger from "@/lib/logger";

// ============================================================================
// FORM DATA TYPES - Local to this service
// ============================================================================

export interface ProcessFormDataInput {
  eventName: string;
  eventEmail: string;
  applicantsFile: File;
}

export interface ProcessFormDataOutput {
  name: string;
  email: string;
  applicantList: NewPerson[];
}

/**
 * @deprecated Direct usage of excelFileToPersonListSafe is recommended for better performance.
 * This function adds unnecessary service layer overhead without business logic value.
 *
 * Legacy service function for processing applicants file.
 * Consider migrating to direct usage of excelFileToPersonListSafe for optimal performance.
 */
export const processApplicantsFile = async (
  file: File,
  errorMessages: { APPLICANT_LIST_ERROR: string }
): Promise<Result<NewPerson[], string>> => {
  // Direct delegation to the optimized utility function
  return excelFileToPersonListSafe(file);
};

export type GenerateQRCodesOutput = {
  eventQRCodeBase64: string;
  ownerIdQRCodeBase64: string;
};

export type EmailAttachment = {
  filename: string;
  content: string;
  encoding: string;
};
