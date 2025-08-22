/**
 * qrcodeUtils.ts
 *
 * Purpose: Client-side QR code generation and processing utilities for DOM-based operations
 *
 * Main Responsibilities:
 * - Extracts QR code data from DOM canvas elements and converts to base64 format
 * - Provides validation utilities for QR code DOM references and generation state
 * - Handles client-side QR code processing for email attachments and storage
 * - Implements functional error handling for QR code generation failures
 * - Supports QR code operations for event access and owner verification workflows
 *
 * Architecture Role:
 * - Bridge between React QR code components and application data processing
 * - Client-side utility layer for QR code manipulation and export
 * - Foundation for QR code integration in email and document workflows
 * - Provides type-safe QR code operations with Result pattern error handling
 * - Critical component for mobile-friendly event access and verification
 */

import { Result, success, failure } from "@/utils/fp";

/**
 * Client-side QR code utilities
 * Handles DOM-related QR code operations
 */

/**
 * Output type for generated QR codes.
 */
export type GenerateQRCodesOutput = {
  eventQRCodeBase64: string;
  ownerIdQRCodeBase64: string;
};

/**
 * Error messages for QR code operations
 */
const QR_CODE_ERRORS = {
  QR_CODE_ERROR: "Failed to generate QR codes. Please try again.",
} as const;

/**
 * Extracts QR code data from DOM canvas elements and converts to base64 strings
 *
 * @param eventQRCodeRef - React ref to DOM element containing event QR code canvas
 * @param ownerQRCodeRef - React ref to DOM element containing owner verification QR code canvas
 * @returns Promise<Result<GenerateQRCodesOutput, string>> with base64 QR codes or error message
 *
 * @sideEffects
 * - Accesses DOM elements through React refs
 * - Reads canvas data for base64 conversion
 *
 * @performance
 * - Canvas.toDataURL() operations can be CPU intensive for large QR codes
 * - Synchronous DOM operations with minimal memory allocation
 *
 * @businessLogic
 * - Generates base64 strings suitable for email attachments and database storage
 * - Removes data URL prefix to return pure base64 content
 * - Both event and owner QR codes required for complete event setup
 *
 * @notes
 * - Requires QR code components to be rendered before extraction
 * - Canvas elements must be present in DOM for successful operation
 * - Pure client-side operation suitable for browser environments only
 *
 * @publicAPI Core utility used by event creation forms and QR code workflows
 */
export const generateQRCodes = async (
  eventQRCodeRef: React.RefObject<HTMLDivElement>,
  ownerQRCodeRef: React.RefObject<HTMLDivElement>
): Promise<Result<GenerateQRCodesOutput, string>> => {
  try {
    if (!eventQRCodeRef.current || !ownerQRCodeRef.current) {
      return failure(QR_CODE_ERRORS.QR_CODE_ERROR);
    }

    // Extract canvas elements from QR code containers
    const eventCanvas = eventQRCodeRef.current.querySelector("canvas");
    const ownerCanvas = ownerQRCodeRef.current.querySelector("canvas");

    if (!eventCanvas || !ownerCanvas) {
      return failure(QR_CODE_ERRORS.QR_CODE_ERROR);
    }

    // Convert canvas to base64
    const eventQRCodeBase64 = eventCanvas.toDataURL("image/png").split(",")[1];
    const ownerIdQRCodeBase64 = ownerCanvas
      .toDataURL("image/png")
      .split(",")[1];

    return success({
      eventQRCodeBase64,
      ownerIdQRCodeBase64,
    });
  } catch (error) {
    return failure(QR_CODE_ERRORS.QR_CODE_ERROR);
  }
};

/**
 * Validates QR code DOM references for availability and accessibility
 *
 * @param eventQRCodeRef - React ref to event QR code DOM container
 * @param ownerQRCodeRef - React ref to owner QR code DOM container
 * @returns Result<boolean, string> indicating validation success or specific error message
 *
 * @sideEffects None - pure function checking DOM ref availability
 * @performance O(1) - simple reference checking without DOM traversal
 * @notes Useful for preventing QR code generation attempts before rendering completion
 * @publicAPI Validation utility used before QR code extraction operations
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
