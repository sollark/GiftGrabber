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
import { useGiftSelector, useGiftActions } from "@/app/contexts/GiftContext";
import { Gift } from "@/database/models/gift.model";
import { generateOrderId, getQRcodeBuffer } from "@/utils/utils";
import { BASE_URL } from "@/config/eventFormConfig";

import GiftComponent from "./GiftComponent";
import QRcode from "@/ui/data-display/QRcode";
import { AccentButton as StyledButton, SecondaryButton } from "@/ui/primitives";

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

  // Derived state with safe context access
  const eventId = eventIdMaybe._tag === "Some" ? eventIdMaybe.value : "";
  const applicantGifts =
    applicantGiftsMaybe._tag === "Some" &&
    Array.isArray(applicantGiftsMaybe.value)
      ? applicantGiftsMaybe.value
      : [];
  const removeGiftAction =
    actions._tag === "Some"
      ? (id: string) =>
          actions.value.dispatchSafe({ type: "REMOVE_GIFT", payload: id })
      : () => {};

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
   * Handles removal of a gift from the applicant's gift list
   *
   * @param gift - The gift object to remove from the list
   */
  const handleRemoveGift = useCallback(
    (gift: Gift) => removeGiftAction(gift._id.toString()),
    [removeGiftAction]
  );

  /**
   * Generates a base64-encoded QR code string from the QR code DOM reference
   *
   * @returns Promise<string | null> - Base64 QR code string or null if generation fails
   */
  const generateQRCodeData = useCallback(async (): Promise<string | null> => {
    const orderQRCodeBuffer = await getQRcodeBuffer(orderQRCodeRef);
    if (!orderQRCodeBuffer) {
      console.error(MESSAGES.QR_CODE_ERROR);
      return null;
    }
    return orderQRCodeBuffer.toString("base64");
  }, []);

  /**
   * Submits the order with applicant data, gifts, and QR code
   *
   * @param qrCodeData - Base64-encoded QR code string for the order
   * @returns Promise<boolean> - True if order creation succeeds, false otherwise
   */
  const submitOrder = useCallback(
    async (qrCodeData: string): Promise<boolean> => {
      if (!applicant) {
        console.error(MESSAGES.NO_APPLICANT_ERROR);
        return false;
      }

      try {
        const response = await makeOrder(
          approverList._tag === "Some" ? approverList.value : [],
          applicant,
          applicantGifts,
          orderId,
          qrCodeData
        );
        return !!response;
      } catch (error) {
        console.error(MESSAGES.ORDER_ERROR, error);
        return false;
      }
    },
    [approverList, applicant, applicantGifts, orderId]
  );

  /**
   * Orchestrates the complete order processing workflow:
   * 1. Generates QR code data
   * 2. Submits the order
   * 3. Navigates to order confirmation page on success
   */
  const processOrder = useCallback(async () => {
    if (!applicant) return;

    const qrCodeData = await generateQRCodeData();
    if (!qrCodeData) return;

    const isSuccess = await submitOrder(qrCodeData);
    if (isSuccess) {
      router.push(`/events/${eventId}/orders/${orderId}`);
    }
  }, [applicant, eventId, orderId, router, generateQRCodeData, submitOrder]);

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
      <StyledButton onClick={processOrder}>Take</StyledButton>
      <QRcode url={orderUrl} qrRef={orderQRCodeRef} />
    </Box>
  );
};

export default GiftList;
