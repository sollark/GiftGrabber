import { excelToPersonList, getQRcodeBuffer } from "@/utils/utils";
import { Person } from "@/database/models/person.model";
import { Result, success, failure } from "@/lib/fp-utils";

export type PersonWithoutId = Omit<Person, "_id">;

export type ProcessFormDataInput = {
  eventName: string;
  eventEmail: string;
  applicantsFile: File;
  approversFile: File;
};

export type ProcessFormDataOutput = {
  name: string;
  email: string;
  applicantList: PersonWithoutId[];
  approverList: PersonWithoutId[];
};

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

  const applicantList = (await excelToPersonList(applicantsFile)) as
    | PersonWithoutId[]
    | null;
  if (!applicantList) {
    return failure(errorMessages.APPLICANT_LIST_ERROR);
  }

  const approverList = (await excelToPersonList(approversFile)) as
    | PersonWithoutId[]
    | null;
  if (!approverList) {
    return failure(errorMessages.APPROVER_LIST_ERROR);
  }

  return success({ name, email, applicantList, approverList });
};

export type GenerateQRCodesOutput = {
  eventQRCodeBase64: string;
  ownerIdQRCodeBase64: string;
};

/**
 * Generates QR codes as base64 strings from refs.
 * Returns Result for FP error handling.
 */
export const generateQRCodes = async (
  eventQRCodeRef: React.RefObject<HTMLDivElement>,
  ownerQRCodeRef: React.RefObject<HTMLDivElement>,
  errorMessages: { QR_CODE_ERROR: string }
): Promise<Result<GenerateQRCodesOutput, string>> => {
  const eventQRCodeBuffer = await getQRcodeBuffer(eventQRCodeRef);
  const ownerIdQRCodeBuffer = await getQRcodeBuffer(ownerQRCodeRef);

  if (!eventQRCodeBuffer || !ownerIdQRCodeBuffer) {
    return failure(errorMessages.QR_CODE_ERROR);
  }

  return success({
    eventQRCodeBase64: eventQRCodeBuffer.toString("base64"),
    ownerIdQRCodeBase64: ownerIdQRCodeBuffer.toString("base64"),
  });
};

export type EmailAttachment = {
  filename: string;
  content: string;
  encoding: string;
};

/**
 * Creates email attachments for QR codes.
 * Pure function.
 */
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
