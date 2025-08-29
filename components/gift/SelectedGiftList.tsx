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
import { useRouter, usePathname } from "next/navigation";
import { Box } from "@mui/material";
import { getMaybeOrElse } from "@/utils/fp";
import { processCompleteOrder } from "@/utils/orderProcessing";

import { useApplicantSelection } from "@/app/contexts/ApplicantContext";
import { useApproverSelection } from "@/app/contexts/ApproverContext";
import {
  useGiftSelector,
  useGiftActions,
} from "@/app/contexts/gift/GiftContext";
import { Gift } from "@/database/models/gift.model";
import { generateOrderId } from "@/utils/utils";
import { BASE_URL } from "@/config/eventFormConfig";
import { useSafeAsync } from "@/utils/fp-hooks";
import ListSkeleton from "@/components/ui/ListSkeleton";

import GiftComponent from "./GiftComponent";
import QRcode from "@/ui/data-display/QRcode";
import { AccentButton as StyledButton, SecondaryButton } from "@/ui/primitives";
import ErrorMessage from "@/ui/form/ErrorMessage";

/**
 * Safely extracts array value from Maybe type with fallback to empty array
 * @param maybeArray - Maybe containing an array
 * @returns Array value or empty array if None or invalid
 */
const extractArrayFromMaybe = function <T>(
  maybeArray: ReturnType<typeof useGiftSelector>
): T[] {
  return getMaybeOrElse<T[]>([])(
    maybeArray._tag === "Some" && Array.isArray(maybeArray.value)
      ? maybeArray
      : ({ _tag: "None" } as any)
  );
};

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
 * GiftList Component Props
 */
interface GiftListProps {
  isLoading?: boolean;
}

/**
 * GiftList Component
 *
 * Renders a list of gifts for the selected applicant with removal functionality
 * and order processing capabilities. Integrates with multiple contexts to manage
 * applicant, approver, and gift state.
 *
 * @param isLoading - Whether the component is in a loading state
 * @returns JSX.Element - The gift list interface with order processing
 */
const GiftList: FC<GiftListProps> = ({ isLoading = false }) => {
  const router = useRouter();
  const orderQRCodeRef = useRef<HTMLDivElement>(null!);

  // Context state selectors
  const { selectedApplicant } = useApplicantSelection();
  const applicantGiftsMaybe = useGiftSelector(
    (state) => state.data.applicantGifts
  );
  const actions = useGiftActions();

  // Get eventId from URL parameters
  const pathname = usePathname();
  const eventId = useMemo(() => {
    const match = pathname.match(/\/events\/([^\/]+)/);
    return match ? match[1] : "";
  }, [pathname]);

  const applicantGifts = useMemo(
    () => extractArrayFromMaybe<Gift>(applicantGiftsMaybe),
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
   * Orchestrates the complete order processing workflow using extracted utilities
   * Provides loading states and error handling with functional patterns
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

      // Use extracted utility for complete order processing
      const result = await processCompleteOrder(
        applicant,
        applicantGifts,
        orderId,
        orderQRCodeRef
      );

      if (result._tag === "Failure") {
        throw result.error;
      }

      // Navigate to order page on success
      router.push(`/events/${eventId}/orders/${orderId}`);

      return result.value; // Return order public ID
    },
    {
      deps: [applicant, applicantGifts, eventId, orderId],
      maxRetries: 1,
    }
  );

  /**
   * Initiates the order processing workflow
   *
   * @returns void
   * @sideEffects Triggers order processing async operation
   */
  const processOrder = useCallback(() => {
    if (!applicant || isProcessingOrder) return;
    executeOrderProcess();
  }, [applicant, isProcessingOrder, executeOrderProcess]);

  /**
   * Handles removal of a gift from the applicant's gift list
   *
   * @param gift - The gift object to remove from the list
   * @returns void
   * @sideEffects Updates gift context by removing the specified gift
   */
  const handleRemoveGift = useCallback(
    (gift: Gift) => removeGiftAction(gift.publicId),
    [removeGiftAction]
  );

  /**
   * Renders a single gift item with its component and remove button
   *
   * @param gift - The gift object to render
   * @returns JSX.Element - Gift item with remove functionality
   */
  const renderGiftItem = useCallback(
    (gift: Gift, index: number) => (
      <li key={gift.publicId || `gift-${index}`}>
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
    if (isLoading && applicantGifts.length === 0) {
      return <ListSkeleton title="Selected Gifts" rows={2} columns={2} />;
    }
    if (!hasGifts) {
      return <p>{MESSAGES.NO_GIFTS}</p>;
    }
    return (
      <ul>
        {applicantGifts.map((gift, index) => renderGiftItem(gift, index))}
      </ul>
    );
  }, [isLoading, hasGifts, applicantGifts, renderGiftItem]);

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
