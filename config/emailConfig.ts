/**
 * emailConfig.ts
 *
 * Purpose: Centralized email configuration for SMTP transport and notification templates
 *
 * Main Responsibilities:
 * - Defines SMTP server configuration for Yahoo email service
 * - Provides standardized email templates and content formatting
 * - Manages attachment naming conventions and encoding specifications
 * - Centralizes email-related constants for consistent messaging
 * - Supports environment-based authentication configuration
 *
 * Architecture Role:
 * - Configuration layer for email infrastructure and service settings
 * - Single source of truth for email formatting and transport parameters
 * - Foundation for email service initialization and template rendering
 * - Environment-aware configuration supporting multiple deployment contexts
 * - Critical dependency for event notification and QR code delivery workflows
 */

// Unified email configuration for GiftGrabber
// Combines event notification and SMTP transport settings

export const EMAIL_CONFIG = {
  HTML_CONTENT: `<html><h1>QR codes</h1></html>`,
  ATTACHMENTS: {
    EVENT_QR_FILENAME: "event QR code.png",
    OWNER_QR_FILENAME: "owner QR code.png",
    ENCODING: "base64" as const,
  },
  SMTP: {
    service: "Yahoo",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  },
} as const;
