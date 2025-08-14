import { excelFileToPersonList } from "@/utils/utils";
import {
  PersonWithoutId,
  ProcessFormDataInput,
  ProcessFormDataOutput,
} from "@/types/event.types";
import { Result, success, failure } from "@/utils/fp";

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

  const applicantList = (await excelFileToPersonList(applicantsFile)) as
    | PersonWithoutId[]
    | null;
  if (!applicantList) {
    return failure(errorMessages.APPLICANT_LIST_ERROR);
  }

  const approverList = (await excelFileToPersonList(approversFile)) as
    | PersonWithoutId[]
    | null;
  if (!approverList) {
    return failure(errorMessages.APPROVER_LIST_ERROR);
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

export const createEmailAttachments = (
  eventQRCodeBase64: string,
  ownerIdQRCodeBase64: string,
  config: {
    EVENT_QR_FILENAME: string;
    OWNER_QR_FILENAME: string;
    ENCODING: string;
  }
): EmailAttachment[] => [
  {
    filename: config.EVENT_QR_FILENAME,
    content: eventQRCodeBase64,
    encoding: config.ENCODING,
  },
  {
    filename: config.OWNER_QR_FILENAME,
    content: ownerIdQRCodeBase64,
    encoding: config.ENCODING,
  },
];
