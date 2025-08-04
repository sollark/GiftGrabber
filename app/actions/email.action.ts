"use server";

import { sendEmail } from "../../lib/email";

/**
 * Configuration constants for email actions
 */
const EMAIL_CONFIG = {
  SUBJECT: "Welcome to NextAPI",
} as const;

/**
 * Log messages for email operations
 */
const LOG_MESSAGES = {
  SENDING: (recipient: string) => `Sending email to ${recipient} ...`,
  SUCCESS: "Email sent successfully",
  FAILED: "Failed to send email:",
} as const;

/**
 * Type definition for email attachment
 */
interface EmailAttachment {
  filename: string;
  content: string;
  encoding: string;
}

/**
 * Type definition for email payload data
 */
interface EmailPayload {
  to: string;
  html: string;
  attachments: EmailAttachment[];
}

/**
 * Type definition for internal email parameters
 */
interface EmailParameters {
  to: string;
  subject: string;
  html: string;
  attachments: EmailAttachment[];
}

/**
 * Sends QR codes to the event owner via email
 * @param data - Email payload containing recipient, HTML content, and attachments
 * @returns Promise<void> - Resolves when email is sent or logs error if failed
 */
export const sendQRCodesToOwner = async (data: EmailPayload): Promise<void> => {
  logEmailSending(data.to);

  try {
    const emailParameters = createEmailParameters(data);
    await sendEmailToRecipient(emailParameters);
    logEmailSuccess();
  } catch (error) {
    logEmailError(error);
  }
};

/**
 * Logs the start of email sending process
 * @param recipient - Email recipient address
 */
const logEmailSending = (recipient: string): void => {
  console.log(LOG_MESSAGES.SENDING(recipient));
};

/**
 * Logs successful email delivery
 */
const logEmailSuccess = (): void => {
  console.log(LOG_MESSAGES.SUCCESS);
};

/**
 * Logs email sending error
 * @param error - The error that occurred during email sending
 */
const logEmailError = (error: unknown): void => {
  console.error(LOG_MESSAGES.FAILED, error);
};

/**
 * Creates email parameters object from payload data
 * @param data - Email payload data
 * @returns EmailParameters - Formatted email parameters for sending
 */
const createEmailParameters = (data: EmailPayload): EmailParameters => ({
  to: data.to,
  subject: EMAIL_CONFIG.SUBJECT,
  html: data.html,
  attachments: data.attachments,
});

/**
 * Sends email using the email service
 * @param emailParameters - Formatted email parameters
 * @returns Promise<void> - Resolves when email is sent
 */
const sendEmailToRecipient = async (
  emailParameters: EmailParameters
): Promise<void> => {
  await sendEmail(emailParameters);
};
