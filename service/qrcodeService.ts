import { Result, success, failure } from "@/utils/fp";

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
