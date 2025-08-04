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
const SMTP_CONFIG = {
  service: "Yahoo",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
} as const;

/**
 * Creates and configures email transporter
 */
const createEmailTransporter = () => {
  return nodemailer.createTransport(SMTP_CONFIG);
};

/**
 * Sends an email using the configured SMTP transport
 * @param data - Email payload containing recipient, subject, content, and attachments
 * @returns Promise resolving to the email send result
 */
export const sendEmail = async (data: EmailPayload) => {
  console.log("Sending email...");

  const transporter = createEmailTransporter();

  return await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    ...data,
  });
};
