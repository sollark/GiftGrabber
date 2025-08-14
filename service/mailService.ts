/**
 * MailService - Functional service for sending emails in GiftGrabber.
 * Encapsulates all mail-related side effects and business logic.
 * Follows functional programming principles: pure interfaces, composable, testable.
 */

import { sendQRCodesToOwner } from "@/app/actions/email.action";
import { Result, success, failure } from "@/utils/fp";
import { ERROR_MESSAGES } from "@/components/event/createEventFormConfig";

/**
 * Email configuration for event-related notifications.
 */
const EMAIL_CONFIG = {
  HTML_CONTENT: `<html><h1>QR codes</h1></html>`,
  ATTACHMENTS: {
    EVENT_QR_FILENAME: "event QR code.png",
    OWNER_QR_FILENAME: "owner QR code.png",
    ENCODING: "base64" as const,
  },
} as const;

/**
 * Creates email attachments for QR codes.
 * @param eventQRCodeBase64 - Base64 string of the event QR code image.
 * @param ownerQRCodeBase64 - Base64 string of the owner QR code image.
 * @returns Array of attachment objects for the email.
 */
const createEmailAttachments = (
  eventQRCodeBase64: string,
  ownerQRCodeBase64: string
): Array<{
  filename: string;
  content: string;
  encoding: "base64";
}> => [
  {
    filename: EMAIL_CONFIG.ATTACHMENTS.EVENT_QR_FILENAME,
    content: eventQRCodeBase64,
    encoding: EMAIL_CONFIG.ATTACHMENTS.ENCODING,
  },
  {
    filename: EMAIL_CONFIG.ATTACHMENTS.OWNER_QR_FILENAME,
    content: ownerQRCodeBase64,
    encoding: EMAIL_CONFIG.ATTACHMENTS.ENCODING,
  },
];

/**
 * Sends an email with QR code attachments to the client.
 * @param email - Recipient's email address.
 * @param eventQRCodeBase64 - Base64 string of the event QR code image.
 * @param ownerQRCodeBase64 - Base64 string of the owner QR code image.
 * @returns Result<null, string> indicating success or error message.
 */
export const sendMailToClient = async (
  email: string,
  eventQRCodeBase64: string,
  ownerQRCodeBase64: string
): Promise<Result<null, string>> => {
  try {
    const mailResult = await sendMail({
      to: email,
      html: EMAIL_CONFIG.HTML_CONTENT,
      attachments: createEmailAttachments(eventQRCodeBase64, ownerQRCodeBase64),
    });
    if (mailResult._tag === "Failure") {
      return { _tag: "Failure", error: mailResult.error };
    }
    return { _tag: "Success", value: null };
  } catch (error) {
    return {
      _tag: "Failure",
      error:
        typeof error === "string" ? error : ERROR_MESSAGES.EVENT_CREATION_ERROR,
    };
  }
};

/**
 * Sends an email with QR code attachments.
 * Returns a Result type for error handling.
 * Pure interface, side effects encapsulated.
 */
export const sendMail = async ({
  to,
  html,
  attachments,
}: {
  to: string;
  html: string;
  attachments: Array<{ filename: string; content: string; encoding: "base64" }>;
}): Promise<Result<null, string>> => {
  try {
    await sendQRCodesToOwner({
      to,
      html,
      attachments,
    });
    return success(null);
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unknown error sending mail";
    return failure(errorMsg);
  }
};
