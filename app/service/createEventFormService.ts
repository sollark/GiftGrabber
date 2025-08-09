import { excelToPersonList, getQRcodeBuffer } from "@/utils/utils";
import { Person } from "@/database/models/person.model";

// Define a type for person objects without '_id'
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
} | null;

/**
 * Processes form data and returns structured event information.
 * Pure function, returns null on error.
 */
export const processFormData = async (
  data: ProcessFormDataInput,
  setErrorMessage: (msg: string) => void,
  errorMessages: { APPLICANT_LIST_ERROR: string; APPROVER_LIST_ERROR: string }
): Promise<ProcessFormDataOutput> => {
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
    setErrorMessage(errorMessages.APPLICANT_LIST_ERROR);
    return null;
  }

  const approverList = (await excelToPersonList(approversFile)) as
    | PersonWithoutId[]
    | null;
  if (!approverList) {
    setErrorMessage(errorMessages.APPROVER_LIST_ERROR);
    return null;
  }

  return { name, email, applicantList, approverList };
};

export type GenerateQRCodesOutput = {
  eventQRCodeBase64: string;
  ownerIdQRCodeBase64: string;
} | null;

/**
 * Generates QR codes as base64 strings from refs.
 * Pure function, returns null on error.
 */
export const generateQRCodes = async (
  eventQRCodeRef: React.RefObject<HTMLDivElement>,
  ownerQRCodeRef: React.RefObject<HTMLDivElement>,
  setErrorMessage: (msg: string) => void,
  errorMessages: { QR_CODE_ERROR: string }
): Promise<GenerateQRCodesOutput> => {
  const eventQRCodeBuffer = await getQRcodeBuffer(eventQRCodeRef);
  const ownerIdQRCodeBuffer = await getQRcodeBuffer(ownerQRCodeRef);

  if (!eventQRCodeBuffer || !ownerIdQRCodeBuffer) {
    setErrorMessage(errorMessages.QR_CODE_ERROR);
    return null;
  }

  return {
    eventQRCodeBase64: eventQRCodeBuffer.toString("base64"),
    ownerIdQRCodeBase64: ownerIdQRCodeBuffer.toString("base64"),
  };
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
