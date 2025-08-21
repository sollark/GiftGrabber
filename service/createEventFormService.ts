import { excelFileToPersonList } from "@/utils/excel_utils";
import { Result, success, failure } from "@/utils/fp";
import { NewPerson } from "@/types/common.types";

// ============================================================================
// FORM DATA TYPES - Local to this service
// ============================================================================

/**
 * Input type for processing event form data
 * Contains event name, email, and applicant/approver files from user input
 */
export interface ProcessFormDataInput {
  eventName: string;
  eventEmail: string;
  applicantsFile: File;
  approversFile?: File;
}

/**
 * Output type for processed event form data
 * Contains normalized event name, email, and applicant/approver lists
 */
export interface ProcessFormDataOutput {
  name: string;
  email: string;
  applicantList: NewPerson[];
  approverList: NewPerson[];
}

/**
 * Processes form data and returns structured event information.
 * Returns Result for FP error handling.
 */
export const processFormData = async (
  data: ProcessFormDataInput,
  errorMessages: { APPLICANT_LIST_ERROR: string; APPROVER_LIST_ERROR: string }
): Promise<Result<ProcessFormDataOutput, string>> => {
  const {
    eventName: name,
    eventEmail: email,
    applicantsFile,
    approversFile,
  } = data;

  const applicantList = await excelFileToPersonList(applicantsFile);
  if (!applicantList) {
    return failure(errorMessages.APPLICANT_LIST_ERROR);
  }

  let approverList: NewPerson[] = [];
  if (approversFile) {
    const parsed = await excelFileToPersonList(approversFile);
    if (!parsed) {
      return failure(errorMessages.APPROVER_LIST_ERROR);
    }
    approverList = parsed;
  }

  return success({ name, email, applicantList, approverList });
};

/**
 * Output type for generated QR codes.
 */
export type GenerateQRCodesOutput = {
  eventQRCodeBase64: string;
  ownerIdQRCodeBase64: string;
};

/**
 * Creates email attachments for QR codes.
 * Pure function.
 */
export type EmailAttachment = {
  filename: string;
  content: string;
  encoding: string;
};
