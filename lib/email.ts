/**
 * email.ts
 *
 * Purpose: Email service infrastructure for SMTP-based email delivery
 *
 * Main Responsibilities:
 * - Provides SMTP email sending capabilities using nodemailer
 * - Handles email attachments for QR codes and documents
 * - Manages SMTP transporter configuration and authentication
 * - Supports HTML email content with embedded attachments
 * - Implements email delivery for event notifications and confirmations
 *
 * Architecture Role:
 * - Core infrastructure service for all email operations
 * - Bridge between application email actions and external SMTP servers
 * - Configurable email transport supporting multiple SMTP providers
 * - Foundation for event-based communication workflows
 * - Critical dependency for user notifications and document delivery
 */

import nodemailer from "nodemailer";

/**
 * Email attachment structure for nodemailer
 */
interface EmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
}

/**
 * Email payload structure for sending emails
 */
interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  attachments: EmailAttachment[];
}

/**
 * SMTP configuration for email transport
 */
import { EMAIL_CONFIG } from "@/config/emailConfig";

/**
 * Creates and configures nodemailer SMTP transporter with environment-based settings
 *
 * @returns Nodemailer transporter configured with SMTP settings from config
 *
 * @sideEffects None - pure function creating transporter instance
 * @performance O(1) - simple transporter creation, no network calls
 * @notes Uses EMAIL_CONFIG.SMTP for provider-agnostic SMTP configuration
 * @internalAPI Helper function for email service setup
 */
const createEmailTransporter = () => {
  return nodemailer.createTransport(EMAIL_CONFIG.SMTP);
};

/**
 * Sends email through SMTP transport with attachments and HTML content
 *
 * @param data - EmailPayload containing recipient, subject, HTML content, and attachments
 * @returns Promise resolving to nodemailer send result with message info
 *
 * @sideEffects
 * - Establishes SMTP connection to email server
 * - Sends email with attachments through external SMTP service
 * - Logs email sending status to console
 *
 * @performance
 * - Network-dependent operation with latency based on SMTP server
 * - Attachment size affects upload time and success rate
 * - Connection pooling may improve performance for multiple emails
 *
 * @businessLogic
 * - Uses environment SMTP_FROM_EMAIL as sender address
 * - Supports HTML email content for rich formatting
 * - Handles file attachments for QR codes and documents
 *
 * @notes
 * - Relies on external SMTP server availability
 * - May fail due to network issues, authentication, or rate limits
 * - Error handling should be implemented by calling functions
 *
 * @publicAPI Core email sending function used by email actions and services
 */
export const sendEmail = async (data: EmailPayload) => {
  console.log("Sending email...");

  const transporter = createEmailTransporter();

  return await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    ...data,
  });
};
