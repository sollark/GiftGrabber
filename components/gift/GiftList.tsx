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
 *
 * Constraints:
 * - No styling or UI changes
 * - No new features or business logic
 * - Only code quality, structure, and documentation improvements
 */

import React, { FC, memo, useRef, useCallback, useMemo } from "react";
import { makeOrder } from "@/app/actions/order.action";
import {
  useApplicantSelection,
  useApplicantSelector,
} from "@/app/contexts/ApplicantContext";
import { useApproverSelection } from "@/app/contexts/ApproverContext";
import { useGiftSelector, useGiftActions } from "@/app/contexts/GiftContext";
import { Gift } from "@/database/models/gift.model";
import { generateOrderId, getQRcodeBuffer } from "@/utils/utils";
import { useRouter } from "next/navigation";
import GiftComponent from "./GiftComponent";
import QRcode from "@/ui/data-display/QRcode";
import { AccentButton as StyledButton, SecondaryButton } from "@/ui/primitives";
import { Box } from "@mui/material";

const BASE_URL = "https://gift-grabber.onrender.com";
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
 * GiftList
 * Renders a list of gifts for the selected applicant, allows removal, and handles order creation.
 * Uses context for applicant, approver, and gift data.
 * @returns The gift list UI for the applicant
 */
const GiftList: FC = () => {
  const router = useRouter();
  const { selectedApplicant } = useApplicantSelection();
  const { approverList } = useApproverSelection();
  const applicantGiftsMaybe = useGiftSelector(
    (state) => state.data.applicantGifts
  );
  const applicantGifts =
    applicantGiftsMaybe._tag === "Some" &&
    Array.isArray(applicantGiftsMaybe.value)
      ? applicantGiftsMaybe.value
      : [];
  const actions = useGiftActions();
  const removeGift =
    actions._tag === "Some"
      ? (id: string) =>
          actions.value.dispatchSafe({ type: "REMOVE_GIFT", payload: id })
      : () => {};
  const eventIdMaybe = useApplicantSelector((state) => state.data.eventId);
  const eventId = eventIdMaybe._tag === "Some" ? eventIdMaybe.value : "";
  const orderQRCodeRef = useRef<HTMLDivElement>(null!);
  const orderId = useMemo(() => generateOrderId(), []);
  const orderUrl = useMemo(
    () => `${BASE_URL}/events/${eventId}/orders/${orderId}`,
    [eventId, orderId]
  );
  const applicant = useMemo(
    () =>
      selectedApplicant._tag === "Some" &&
      selectedApplicant.value._tag === "Some"
        ? selectedApplicant.value.value
        : null,
    [selectedApplicant]
  );
  const applicantDisplayName = useMemo(
    () => applicant?.firstName || "Unknown",
    [applicant?.firstName]
  );
  const gifts = useMemo(() => applicantGifts, [applicantGifts]);
  const hasGifts = useMemo(() => gifts.length > 0, [gifts.length]);

  /**
   * handleRemoveGift
   * Removes a gift from the list by ID.
   * @param gift - The gift to remove
   */
  const handleRemoveGift = useCallback(
    (gift: Gift) => removeGift(gift._id.toString()),
    [removeGift]
  );

  /**
   * generateQRCodeData
   * Generates a base64-encoded QR code string from the QR code ref.
   * @returns The base64 QR code string or null if generation fails
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
   * submitOrder
   * Submits the order with the given QR code data.
   * @param qrCodeData - The base64 QR code string
   * @returns True if the order was created successfully, false otherwise
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
          gifts,
          orderId,
          qrCodeData
        );
        return !!response;
      } catch (error) {
        console.error(MESSAGES.ORDER_ERROR, error);
        return false;
      }
    },
    [approverList, applicant, gifts, orderId]
  );

  /**
   * processOrder
   * Handles the full order process: generates QR code, submits order, and navigates on success.
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
   * renderGiftItem
   * Renders a single gift item with a remove button.
   * @param gift - The gift to render
   * @returns JSX for the gift list item
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
   * renderGiftsList
   * Renders the list of gifts or a message if there are none.
   * @returns JSX for the gift list or a no-gifts message
   */
  const renderGiftsList = useCallback(() => {
    if (!hasGifts) {
      return <p>{MESSAGES.NO_GIFTS}</p>;
    }
    return <ul>{gifts.map(renderGiftItem)}</ul>;
  }, [hasGifts, gifts, renderGiftItem]);

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
