/**
 * orderProcessing.ts
 *
 * Purpose: Utility functions for order processing workflow operations
 *
 * Main Responsibilities:
 * - Provides reusable order processing functions for QR code generation
 * - Implements order submission with proper error handling
 * - Encapsulates order workflow business logic separate from UI components
 * - Uses functional programming patterns with Result types for safety
 *
 * Architecture Role:
 * - Business logic layer between UI components and action functions
 * - Enables testing of order operations independent of React components
 * - Promotes code reuse across different order-related components
 */

import { Result, success, failure, tryAsync } from "@/utils/fp";
import { makeOrder } from "@/app/actions/order.action";
import { getQRcodeBuffer } from "@/utils/utils";
import { Gift } from "@/database/models/gift.model";
import { Person } from "@/database/models/person.model";

/**
 * Generates a base64-encoded QR code string from a DOM element reference
 *
 * @param qrCodeRef - React ref to the QR code DOM element
 * @returns Promise<Result<string, Error>> - Base64 QR code string or error
 */
export const generateQRCodeData = async (
  qrCodeRef: React.RefObject<HTMLDivElement>
): Promise<Result<string, Error>> => {
  const asyncOperation = tryAsync(async () => {
    const orderQRCodeBuffer = await getQRcodeBuffer(qrCodeRef);
    if (!orderQRCodeBuffer) {
      throw new Error("Failed to generate QR code buffer");
    }
    return orderQRCodeBuffer.toString("base64");
  });

  return await asyncOperation();
};

/**
 * Submits an order with applicant data, gifts, and QR code
 *
 * @param applicant - The person placing the order
 * @param gifts - Array of gifts to include in the order
 * @param orderId - Unique identifier for the order
 * @param qrCodeData - Base64-encoded QR code string
 * @returns Promise<Result<string, Error>> - Order public ID or error
 */
export const submitOrder = async (
  applicant: Person,
  gifts: Gift[],
  orderId: string,
  qrCodeData: string
): Promise<Result<string, Error>> => {
  const asyncOperation = tryAsync(async () => {
    if (!applicant) {
      throw new Error("No applicant selected");
    }

    if (!gifts || gifts.length === 0) {
      throw new Error("No gifts selected");
    }

    const orderPublicId = await makeOrder(
      applicant.publicId,
      gifts.map((gift) => gift.publicId),
      orderId,
      qrCodeData
    );

    if (!orderPublicId) {
      throw new Error("Order creation failed");
    }

    return orderPublicId;
  });

  return await asyncOperation();
};

/**
 * Complete order processing workflow that combines QR generation and order submission
 *
 * @param applicant - The person placing the order
 * @param gifts - Array of gifts to include in the order
 * @param orderId - Unique identifier for the order
 * @param qrCodeRef - React ref to the QR code DOM element
 * @returns Promise<Result<string, Error>> - Order public ID or error
 */
export const processCompleteOrder = async (
  applicant: Person,
  gifts: Gift[],
  orderId: string,
  qrCodeRef: React.RefObject<HTMLDivElement>
): Promise<Result<string, Error>> => {
  // Step 1: Generate QR code
  const qrCodeResult = await generateQRCodeData(qrCodeRef);
  if (qrCodeResult._tag === "Failure") {
    return qrCodeResult;
  }

  // Step 2: Submit order with QR code
  const orderResult = await submitOrder(
    applicant,
    gifts,
    orderId,
    qrCodeResult.value
  );

  return orderResult;
};
