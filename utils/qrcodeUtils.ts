/**
 * qrcodeUtils.ts
 *
 * Purpose: Provides client-side QR code generation, extraction, and validation utilities for DOM-based operations.
 *
 * Responsibilities:
 * - Extracts QR code data from DOM canvas elements and converts to base64 format or Buffer
 * - Validates QR code DOM references for availability
 * - Handles QR code processing for email attachments, event access, and owner verification
 * - Implements functional error handling for QR code generation failures
 * - Promotes maintainable, readable, and type-safe QR code operations
 *
 * Usage:
 * - Used by event creation forms, order workflows, and QR code-related business logic
 * - All functions are pure except those that access DOM/canvas
 */

import { Result, success, failure } from "@/utils/fp";

/**
 * Output type for generated QR codes (event and owner).
 */
export type GenerateQRCodesOutput = {
  eventQRCodeBase64: string;
  ownerIdQRCodeBase64: string;
};

/**
 * Error messages for QR code operations.
 */
const QR_CODE_ERRORS = {
  QR_CODE_ERROR: "Failed to generate QR codes. Please try again.",
} as const;

/**
 * Extracts a QR code buffer from a React ref to a QR code element.
 * Impure: depends on DOM and React ref.
 * @param qrRef - React ref to QR code DOM container
 * @returns {Promise<Buffer | undefined>} Buffer containing QR code PNG data, or undefined if not found
 */
export const getQRcodeBuffer = async (
  qrRef: React.RefObject<HTMLDivElement>
): Promise<Buffer | undefined> => {
  if (qrRef.current) {
    const canvas = qrRef.current.querySelector("canvas");
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      return Buffer.from(pngUrl.split(",")[1], "base64");
    }
  }
  return undefined;
};

/**
 * Generates a base64-encoded QR code string from a DOM element reference.
 * Uses getQRcodeBuffer internally.
 * @param qrCodeRef - React ref to QR code DOM container
 * @returns {Promise<Result<string, Error>>} Base64 QR code string or error
 */
export const generateQRCodeData = async (
  qrCodeRef: React.RefObject<HTMLDivElement>
): Promise<Result<string, Error>> => {
  try {
    const qrCodeBuffer = await getQRcodeBuffer(qrCodeRef);
    if (!qrCodeBuffer) {
      return failure(new Error("Failed to generate QR code buffer"));
    }
    return success(qrCodeBuffer.toString("base64"));
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

/**
 * Extracts QR code data from two DOM canvas elements and converts to base64 strings.
 * Requires QR code components to be rendered before extraction.
 * @param eventQRCodeRef - React ref to event QR code DOM container
 * @param ownerQRCodeRef - React ref to owner QR code DOM container
 * @returns {Promise<Result<GenerateQRCodesOutput, string>>} with base64 QR codes or error message
 */
export const generateQRCodes = async (
  eventQRCodeRef: React.RefObject<HTMLDivElement>,
  ownerQRCodeRef: React.RefObject<HTMLDivElement>
): Promise<Result<GenerateQRCodesOutput, string>> => {
  try {
    if (!eventQRCodeRef.current || !ownerQRCodeRef.current) {
      return failure(QR_CODE_ERRORS.QR_CODE_ERROR);
    }
    const eventCanvas = eventQRCodeRef.current.querySelector("canvas");
    const ownerCanvas = ownerQRCodeRef.current.querySelector("canvas");
    if (!eventCanvas || !ownerCanvas) {
      return failure(QR_CODE_ERRORS.QR_CODE_ERROR);
    }
    const eventQRCodeBase64 = eventCanvas.toDataURL("image/png").split(",")[1];
    const ownerIdQRCodeBase64 = ownerCanvas
      .toDataURL("image/png")
      .split(",")[1];
    return success({ eventQRCodeBase64, ownerIdQRCodeBase64 });
  } catch (error) {
    return failure(QR_CODE_ERRORS.QR_CODE_ERROR);
  }
};

/**
 * Validates QR code DOM references for availability and accessibility.
 * Pure function, does not access DOM.
 * @param eventQRCodeRef - React ref to event QR code DOM container
 * @param ownerQRCodeRef - React ref to owner QR code DOM container
 * @returns {Result<boolean, string>} indicating validation success or error message
 */
export const validateQRCodeRefs = (
  eventQRCodeRef: React.RefObject<HTMLDivElement>,
  ownerQRCodeRef: React.RefObject<HTMLDivElement>
): Result<boolean, string> => {
  if (!eventQRCodeRef.current || !ownerQRCodeRef.current) {
    return failure("QR code references are not available");
  }
  return success(true);
};
