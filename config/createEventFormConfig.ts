export const FORM_CONFIG = {
  DEFAULT_VALUES: {
    eventName: "",
    eventEmail: "",
    applicantsFile: undefined,
    approversFile: undefined,
  },
  INPUT_STYLES: { style: { fontSize: 24 } },
} as const;

export const BASE_URL = "https://gift-grabber.onrender.com/events";

export const ERROR_MESSAGES = {
  APPLICANT_LIST_ERROR: "Error getting an applicant list",
  APPROVER_LIST_ERROR: "Error getting an approvers list",
  QR_CODE_ERROR: "Error getting QR code",
  EVENT_CREATION_ERROR: "Error creating event",
} as const;

export const EMAIL_CONFIG = {
  HTML_CONTENT: `<html><h1>QR codes</h1></html>`,
  ATTACHMENTS: {
    EVENT_QR_FILENAME: "event QR code.png",
    OWNER_QR_FILENAME: "owner QR code.png",
    ENCODING: "base64" as const,
  },
} as const;
