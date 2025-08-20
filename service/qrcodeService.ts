import { Result, success, failure } from "@/utils/fp";

// TODO: ARCHITECTURAL ISSUE - This service violates the server-only service pattern
// This service has a hybrid client/server responsibility which breaks the clean separation:
//
// PROBLEM:
// - Accepts React.RefObject parameters (client-side DOM references)
// - Performs server-side Buffer operations (.toString("base64"))
// - Mixed client/server dependencies make it unclear where this runs
// - Violates the principle that services should be pure server-side business logic
//
// SOLUTION OPTIONS:
// 1. SPLIT INTO TWO SERVICES:
//    - Client service: Extract QR code data from DOM refs
//    - Server service: Convert raw QR data to base64 buffers
// 2. MOVE TO CLIENT UTILITY:
//    - If this only runs client-side, move to utils/ and rename appropriately
// 3. REFACTOR TO SERVER-ONLY:
//    - Generate QR codes directly on server without DOM dependencies
//    - Pass raw QR data instead of DOM refs
//
// RECOMMENDATION: Option 1 (split) for better separation of concerns

/**
 * Output type for generated QR codes.
 */
export type GenerateQRCodesOutput = {
  eventQRCodeBase64: string;
  ownerIdQRCodeBase64: string;
};

/**
 * Generates QR codes as base64 strings from refs.
 * Returns Result for FP error handling.
 * @param eventQRCodeRef - Ref to the event QR code element.
 * @param ownerQRCodeRef - Ref to the owner QR code element.
 * @param errorMessages - Object with QR_CODE_ERROR string.
 * @returns Result with base64 QR codes or error message.
 */
export const generateQRCodes = async (
  eventQRCodeRef: React.RefObject<HTMLDivElement>,
  ownerQRCodeRef: React.RefObject<HTMLDivElement>,
  errorMessages: { QR_CODE_ERROR: string }
): Promise<Result<GenerateQRCodesOutput, string>> => {
  // Import getQRcodeBuffer from utils
  const { getQRcodeBuffer } = await import("@/utils/utils");

  const eventQRCodeBuffer = await getQRcodeBuffer(eventQRCodeRef);
  const ownerIdQRCodeBuffer = await getQRcodeBuffer(ownerQRCodeRef);

  if (!eventQRCodeBuffer || !ownerIdQRCodeBuffer) {
    return failure(errorMessages.QR_CODE_ERROR);
  }

  return success({
    eventQRCodeBase64: eventQRCodeBuffer.toString("base64"),
    ownerIdQRCodeBase64: ownerIdQRCodeBuffer.toString("base64"),
  });
};
