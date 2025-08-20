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
 * Extracts QR code data from DOM elements and converts to base64
 * Pure client-side operation that handles DOM references
 */
export const generateQRCodes = async (
  eventQRCodeRef: React.RefObject<HTMLDivElement>,
  ownerQRCodeRef: React.RefObject<HTMLDivElement>,
  errorMessages: { QR_CODE_ERROR: string }
): Promise<Result<GenerateQRCodesOutput, string>> => {
  try {
    if (!eventQRCodeRef.current || !ownerQRCodeRef.current) {
      return failure(errorMessages.QR_CODE_ERROR);
    }

    // Extract canvas elements from QR code containers
    const eventCanvas = eventQRCodeRef.current.querySelector("canvas");
    const ownerCanvas = ownerQRCodeRef.current.querySelector("canvas");

    if (!eventCanvas || !ownerCanvas) {
      return failure(errorMessages.QR_CODE_ERROR);
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
    return failure(errorMessages.QR_CODE_ERROR);
  }
};

/**
 * Validates QR code DOM references
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
