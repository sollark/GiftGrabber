import { excelFileToPersonList } from "@/utils/excel_utils";
import { Result, success, failure } from "@/utils/fp";
import { NewPerson } from "@/types/common.types";

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

export const processFormData = async (
  data: ProcessFormDataInput,
  errorMessages: { APPLICANT_LIST_ERROR: string }
): Promise<Result<ProcessFormDataOutput, string>> => {
  const { eventName: name, eventEmail: email, applicantsFile } = data;

  const applicantList = await excelFileToPersonList(applicantsFile);
  if (!applicantList) {
    return failure(errorMessages.APPLICANT_LIST_ERROR);
  }

  return success({ name, email, applicantList });
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
