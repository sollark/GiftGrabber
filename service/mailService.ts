/**
 * MailService - Functional service for sending emails in GiftGrabber.
 * Encapsulates all mail-related side effects and business logic.
 * Follows functional programming principles: pure interfaces, composable, testable.
 */

import { sendQRCodesToOwner } from "@/app/actions/email.action";
import logger from "@/lib/logger";
import { Result, success, failure } from "@/utils/fp";
import { ERROR_MESSAGES } from "@/config/eventFormConfig";

/**
 * Email configuration for event-related notifications.
 */
import { EMAIL_CONFIG } from "@/config/emailConfig";

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
      logger.error(`Failed to send mail to ${email}: ${mailResult.error}`);
      return { _tag: "Failure", error: mailResult.error };
    }
    logger.info(`Mail sent successfully to ${email}`);
    return { _tag: "Success", value: null };
  } catch (error) {
    logger.error(`Exception sending mail to ${email}: ${error}`);
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
    logger.info(`Mail sent successfully to ${to}`);
    return success(null);
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unknown error sending mail";
    logger.error(`Failed to send mail to ${to}: ${errorMsg}`);
    return failure(errorMsg);
  }
};
