import { Result, success, failure } from "@/utils/fp";

/**
 * Server-side QR code service
 * Handles server-only QR code operations (base64 processing, validation)
 *
 * Note: This service is now focused purely on server-side operations.
 * Client-side DOM operations have been moved to utils/qrcodeUtils.ts
 */

/**
 * Validates base64 QR code data
 */
export const validateQRCodeBase64 = (
  base64Data: string
): Result<boolean, string> => {
  try {
    if (!base64Data || base64Data.length === 0) {
      return failure("QR code data is empty");
    }

    // Basic base64 validation
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Pattern.test(base64Data)) {
      return failure("Invalid base64 format");
    }

    return success(true);
  } catch (error) {
    return failure("QR code validation failed");
  }
};

/**
 * Processes QR code data for storage
 */
export const processQRCodeForStorage = (
  base64Data: string
): Result<Buffer, string> => {
  try {
    const buffer = Buffer.from(base64Data, "base64");
    return success(buffer);
  } catch (error) {
    return failure("Failed to process QR code data");
  }
};

/**
 * Creates QR code metadata for database storage
 */
export const createQRCodeMetadata = (
  eventQRCode: string,
  ownerQRCode: string
): Result<{ eventQR: string; ownerQR: string; createdAt: Date }, string> => {
  const eventValidation = validateQRCodeBase64(eventQRCode);
  const ownerValidation = validateQRCodeBase64(ownerQRCode);

  if (eventValidation._tag === "Failure") {
    return failure(`Event QR validation failed: ${eventValidation.error}`);
  }

  if (ownerValidation._tag === "Failure") {
    return failure(`Owner QR validation failed: ${ownerValidation.error}`);
  }

  return success({
    eventQR: eventQRCode,
    ownerQR: ownerQRCode,
    createdAt: new Date(),
  });
};
