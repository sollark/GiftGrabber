"use server";
import logger from "@/lib/logger";
/**
 * email.action.ts
 *
 * Purpose: Server actions for email delivery with QR code attachments and event notifications
 *
 * Main Responsibilities:
 * - Processes email sending requests with QR code attachments for event management
 * - Handles email composition with HTML templates and file attachments
 * - Provides server-side email operations for event creation and order confirmation workflows
 * - Implements error handling and logging for email delivery monitoring
 * - Supports multiple attachment types for QR codes and event-related documents
 *
 * Architecture Role:
 * - Server action layer connecting client forms to email service infrastructure
 * - Bridge between event creation workflow and external email delivery systems
 * - Handles sensitive email operations in secure server environment
 * - Provides typed interfaces for email composition and attachment handling
 * - Enables email-based event sharing and order confirmation notifications
 */

import { sendEmail } from "@/lib/email";

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
 * Server action for sending QR codes to event owners via email
 *
 * @param data - EmailPayload containing recipient address, HTML content, and QR code attachments
 * @returns Promise<void> - Resolves when email is successfully sent or logs error
 *
 * @sideEffects
 * - Sends email through external email service
 * - Logs sending progress and results to console
 * - May trigger external SMTP or email API calls
 *
 * @performance
 * - Async operation dependent on email service response time
 * - Network latency affects completion time
 * - Error handling prevents server action failures
 *
 * @businessLogic
 * - Primary workflow for event owner notifications
 * - Delivers QR codes for event access and owner verification
 * - Critical for event creation completion workflow
 *
 * @publicAPI Server action called from event creation forms and workflows
 */
export const sendQRCodesToOwner = async (data: EmailPayload): Promise<void> => {
  logger.info("[EMAIL] sendQRCodesToOwner", {
    to: data.to,
    timestamp: Date.now(),
  });
  logEmailSending(data.to);

  try {
    const emailParameters = createEmailParameters(data);
    await sendEmailToRecipient(emailParameters);
    logger.info("[EMAIL:RESULT] sendQRCodesToOwner", {
      to: data.to,
      status: "sent",
      timestamp: Date.now(),
    });
    logEmailSuccess();
  } catch (error) {
    logger.error("[EMAIL:RESULT] sendQRCodesToOwner", {
      to: data.to,
      status: "failed",
      error,
      timestamp: Date.now(),
    });
    logEmailError(error);
  }
};

/**
 * Logs the initiation of email sending process with recipient information
 *
 * @param recipient - Email address receiving the notification
 *
 * @sideEffects Outputs log message to console for monitoring and debugging
 * @performance O(1) - simple console logging operation
 * @notes Provides audit trail for email delivery attempts
 * @internalAPI Helper function for email operation logging
 */
const logEmailSending = (recipient: string): void => {
  console.log(LOG_MESSAGES.SENDING(recipient));
};

/**
 * Logs successful completion of email delivery operation
 *
 * @sideEffects Outputs success message to console for monitoring
 * @performance O(1) - simple console logging operation
 * @notes Confirms successful email delivery for operational monitoring
 * @internalAPI Helper function for email operation logging
 */
const logEmailSuccess = (): void => {
  console.log(LOG_MESSAGES.SUCCESS);
};

/**
 * Logs email sending errors with error details for debugging
 *
 * @param error - Error object or message from failed email operation
 *
 * @sideEffects Outputs error message to console for debugging and monitoring
 * @performance O(1) - simple console logging operation
 * @notes Critical for troubleshooting email delivery issues in production
 * @internalAPI Helper function for email operation error logging
 */
const logEmailError = (error: unknown): void => {
  console.error(LOG_MESSAGES.FAILED, error);
};

/**
 * Transforms email payload into formatted parameters for email service
 *
 * @param data - Raw email payload from client request
 * @returns EmailParameters object with standardized structure for email service
 *
 * @sideEffects None - pure function performing data transformation
 * @performance O(1) - simple object transformation
 * @notes Applies default subject line and formats attachments for email service
 * @internalAPI Helper function for email data preparation
 */
const createEmailParameters = (data: EmailPayload): EmailParameters => ({
  to: data.to,
  subject: EMAIL_CONFIG.SUBJECT,
  html: data.html,
  attachments: data.attachments,
});

/**
 * Executes email sending through underlying email service infrastructure
 *
 * @param emailParameters - Formatted email parameters ready for delivery
 * @returns Promise<void> - Resolves when email service confirms delivery
 *
 * @sideEffects
 * - Calls external email service (SMTP, SendGrid, etc.)
 * - May generate network requests to email providers
 * - Updates email service quotas and delivery metrics
 *
 * @performance
 * - Dependent on email service API response times
 * - Network latency and email service load affect performance
 * - Async operation that may take several seconds
 *
 * @notes
 * - Abstracts email service implementation details
 * - Enables switching between different email providers
 * - Critical integration point for external email infrastructure
 *
 * @internalAPI Helper function wrapping email service calls
 */
const sendEmailToRecipient = async (
  emailParameters: EmailParameters
): Promise<void> => {
  await sendEmail(emailParameters);
};
