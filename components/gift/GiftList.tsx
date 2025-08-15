/**
 * GiftList.tsx
 *
 * This file defines the GiftList component, which manages and displays a list of gifts for an applicant.
 *
 * Responsibilities:
 * - Display a list of gifts for the selected applicant
 * - Allow removal of gifts from the list
 * - Handle order creation and QR code generation
 * - Use context for applicant, approver, and gift data
 * - Navigate to order confirmation page upon successful order submission
 * - Integrate with multiple contexts for state management with safe access patterns
 *
 * Technical Features:
 * - Context-driven state management with functional programming patterns
 * - Memoized computations for performance optimization
 * - Error handling for QR code generation and order submission
 * - Safe context access using Maybe/Option patterns
 *
 * Constraints:
 * - No styling or UI changes
 * - No new features or business logic
 * - Only code quality, structure, and documentation improvements
 */

import React, { FC, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";

import { makeOrder } from "@/app/actions/order.action";
import {
  useApplicantSelection,
  useApplicantSelector,
} from "@/app/contexts/ApplicantContext";
import { useApproverSelection } from "@/app/contexts/ApproverContext";
import {
  useGiftSelector,
  useGiftActions,
} from "@/app/contexts/gift/GiftContext";
import { Gift } from "@/database/models/gift.model";
import { generateOrderId, getQRcodeBuffer } from "@/utils/utils";
import { BASE_URL } from "@/config/eventFormConfig";
import { useSafeAsync } from "@/utils/fp-hooks";

import GiftComponent from "./GiftComponent";
import QRcode from "@/ui/data-display/QRcode";
import { AccentButton as StyledButton, SecondaryButton } from "@/ui/primitives";
import ErrorMessage from "@/ui/form/ErrorMessage";

// Component constants
const GIFT_LIST_STYLES = {
  container: { paddingTop: "3rem" },
  giftItem: { marginBottom: "1rem" },
} as const;

const MESSAGES = {
  NO_GIFTS: "No gifts selected",
  QR_CODE_ERROR: "Failed to generate QR code buffer",
  NO_APPLICANT_ERROR: "No applicant selected",
  ORDER_ERROR: "Error creating order:",
} as const;

/**
 * GiftList Component
 *
 * Renders a list of gifts for the selected applicant with removal functionality
 * and order processing capabilities. Integrates with multiple contexts to manage
 * applicant, approver, and gift state.
 *
 * @returns JSX.Element - The gift list interface with order processing
 */
const GiftList: FC = () => {
  const router = useRouter();
  const orderQRCodeRef = useRef<HTMLDivElement>(null!);

  // Context state selectors
  const { selectedApplicant } = useApplicantSelection();
  const { approverList } = useApproverSelection();
  const eventIdMaybe = useApplicantSelector((state) => state.data.eventId);
  const applicantGiftsMaybe = useGiftSelector(
    (state) => state.data.applicantGifts
  );
  const actions = useGiftActions();

  // Memoized derived state with safe context access for consistent dependencies
  const eventId = useMemo(
    () => (eventIdMaybe._tag === "Some" ? eventIdMaybe.value : ""),
    [eventIdMaybe]
  );

  const applicantGifts = useMemo(
    () =>
      applicantGiftsMaybe._tag === "Some" &&
      Array.isArray(applicantGiftsMaybe.value)
        ? applicantGiftsMaybe.value
        : [],
    [applicantGiftsMaybe]
  );

  const removeGiftAction = useMemo(
    () =>
      actions._tag === "Some"
        ? (id: string) =>
            actions.value.dispatchSafe({ type: "REMOVE_GIFT", payload: id })
        : () => {},
    [actions]
  );

  // Memoized computed values
  const orderId = useMemo(() => generateOrderId(), []);

  const orderUrl = useMemo(
    () => `${BASE_URL}/events/${eventId}/orders/${orderId}`,
    [eventId, orderId]
  );

  const applicant = useMemo(() => {
    return selectedApplicant._tag === "Some" &&
      selectedApplicant.value._tag === "Some"
      ? selectedApplicant.value.value
      : null;
  }, [selectedApplicant]);

  const applicantDisplayName = useMemo(
    () => applicant?.firstName || "Unknown",
    [applicant?.firstName]
  );

  const hasGifts = useMemo(
    () => applicantGifts.length > 0,
    [applicantGifts.length]
  );

  /**
   * Generates a base64-encoded QR code string from the QR code DOM reference
   *
   * @returns Promise<string> - Base64 QR code string
   * @throws Error if QR code generation fails
   */
  const generateQRCodeData = useCallback(async (): Promise<string> => {
    const orderQRCodeBuffer = await getQRcodeBuffer(orderQRCodeRef);
    if (!orderQRCodeBuffer) {
      throw new Error(MESSAGES.QR_CODE_ERROR);
    }
    return orderQRCodeBuffer.toString("base64");
  }, []);

  /**
   * Submits the order with applicant data, gifts, and QR code
   *
   * @param qrCodeData - Base64-encoded QR code string for the order
   * @returns Promise<boolean> - True if order creation succeeds
   * @throws Error if order creation fails
   */
  const submitOrder = useCallback(
    async (qrCodeData: string): Promise<boolean> => {
      if (!applicant) {
        throw new Error(MESSAGES.NO_APPLICANT_ERROR);
      }

      const response = await makeOrder(
        approverList._tag === "Some" ? approverList.value : [],
        applicant,
        applicantGifts,
        orderId,
        qrCodeData
      );

      if (!response) {
        throw new Error("Order creation failed");
      }

      return true;
    },
    [approverList, applicant, applicantGifts, orderId]
  );

  /**
   * Orchestrates the complete order processing workflow using safe async patterns
   * Provides loading states and error handling
   */
  const {
    data: orderResult,
    error: orderError,
    loading: isProcessingOrder,
    execute: executeOrderProcess,
    reset: resetOrderProcess,
  } = useSafeAsync(
    async () => {
      if (!applicant) {
        throw new Error(MESSAGES.NO_APPLICANT_ERROR);
      }

      // Step 1: Generate QR code
      const qrCodeData = await generateQRCodeData();

      // Step 2: Submit order
      const success = await submitOrder(qrCodeData);
      if (!success) {
        throw new Error("Order submission failed");
      }

      // Step 3: Navigate to order page
      router.push(`/events/${eventId}/orders/${orderId}`);

      return true;
    },
    {
      deps: [applicant, eventId, orderId],
      maxRetries: 1,
    }
  );

  /**
   * Initiates the order processing workflow
   */
  const processOrder = useCallback(() => {
    if (!applicant || isProcessingOrder) return;
    executeOrderProcess();
  }, [applicant, isProcessingOrder, executeOrderProcess]);

  /**
   * Handles removal of a gift from the applicant's gift list
   *
   * @param gift - The gift object to remove from the list
   */
  const handleRemoveGift = useCallback(
    (gift: Gift) => removeGiftAction(gift._id.toString()),
    [removeGiftAction]
  );

  /**
   * Renders a single gift item with its component and remove button
   *
   * @param gift - The gift object to render
   * @returns JSX.Element - Gift item with remove functionality
   */
  const renderGiftItem = useCallback(
    (gift: Gift) => (
      <li key={gift._id.toString()}>
        <div className="flex flex-row" style={GIFT_LIST_STYLES.giftItem}>
          <GiftComponent gift={gift} />
          <SecondaryButton onClick={() => handleRemoveGift(gift)}>
            Remove
          </SecondaryButton>
        </div>
      </li>
    ),
    [handleRemoveGift]
  );

  /**
   * Renders the complete gift list or empty state message
   *
   * @returns JSX.Element - Either the gift list or no-gifts message
   */
  const renderGiftsList = useCallback(() => {
    if (!hasGifts) {
      return <p>{MESSAGES.NO_GIFTS}</p>;
    }
    return <ul>{applicantGifts.map(renderGiftItem)}</ul>;
  }, [hasGifts, applicantGifts, renderGiftItem]);

  return (
    <Box sx={GIFT_LIST_STYLES.container}>
      <h3>{applicantDisplayName} gifts:</h3>
      {renderGiftsList()}
      <StyledButton
        onClick={processOrder}
        disabled={!applicant || isProcessingOrder}
      >
        {isProcessingOrder ? "Processing..." : "Take"}
      </StyledButton>
      {orderError._tag === "Some" && (
        <ErrorMessage message={orderError.value.message} />
      )}
      <QRcode url={orderUrl} qrRef={orderQRCodeRef} />
    </Box>
  );
};

export default GiftList;
