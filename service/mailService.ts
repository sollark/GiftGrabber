/**
 * MailService - Functional service for sending emails in GiftGrabber.
 * Encapsulates all mail-related side effects and business logic.
 * Follows functional programming principles: pure interfaces, composable, testable.
 */

import { sendQRCodesToOwner } from "@/app/actions/email.action";
import { EmailAttachment } from "./createEventFormService";
import { Result, success, failure } from "@/lib/fp-utils";

export type SendMailInput = {
  to: string;
  html: string;
  attachments: EmailAttachment[];
};

/**
 * Sends an email with QR code attachments.
 * Returns a Result type for error handling.
 * Pure interface, side effects encapsulated.
 */
export const sendMail = async (
  input: SendMailInput
): Promise<Result<void, string>> => {
  try {
    await sendQRCodesToOwner({
      to: input.to,
      html: input.html,
      attachments: input.attachments,
    });
    return success(undefined);
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
