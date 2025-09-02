/**
 * SelectedGiftList.tsx
 *
 * This file defines the SelectedGiftList component, which manages and displays a list of gifts for an applicant.
 *
 * Responsibilities:
 * - Display a list of gifts for the selected applicant
 * - Allow removal of gifts from the list
 * - Handle order creation and QR code generation
 * - Use context for applicant, and gift data
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
import { processCompleteOrder } from "@/utils/orderProcessing";
import { useSelectedApplicant } from "@/app/contexts/ApplicantContext";
import { useGiftContext } from "@/app/contexts/gift/GiftContext";
import { Gift } from "@/database/models/gift.model";
import { generateOrderId } from "@/utils/utils";
import { BASE_URL } from "@/config/eventFormConfig";
import { useSafeAsync } from "@/utils/fp-hooks";
import ListSkeleton from "@/components/ui/ListSkeleton";
import GiftComponent from "./GiftInfo";
import QRcode from "@/ui/data-display/QRcode";
import { AccentButton as StyledButton, SecondaryButton } from "@/ui/primitives";
import ErrorMessage from "@/ui/form/ErrorMessage";
import { BaseTableColumn } from "@/ui/table/BaseTable";
import { ControlledBaseTable } from "@/ui/table/ControlledBaseTable";
import { useOrderContext } from "@/app/contexts/order/OrderContext";

// Use getMaybeOrElse from utils/fp to safely extract array from Maybe type

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
 * Props for SelectedGiftList component
 * @property isLoading - Whether the component is in a loading state
 */
export interface SelectedGiftListProps {
  isLoading?: boolean;
}

/**
 * SelectedGiftList Component
 *
 * Renders a list of gifts for the selected applicant with removal functionality
 * and order processing capabilities. Integrates with multiple contexts to manage
 * applicant and gift state.
 *
 * @param isLoading - Whether the component is in a loading state
 * @returns JSX.Element - The gift list interface with order processing
 */
const SelectedGiftList: FC<SelectedGiftListProps> = ({ isLoading = false }) => {
  const router = useRouter();
  const orderQRCodeRef = useRef<HTMLDivElement>(null!);

  // Context state selectors
  const selectedApplicant = useSelectedApplicant();
  const giftContext = useGiftContext();
  const orderContext = useOrderContext();
  // Extract state and dispatch from context
  const applicantGifts =
    giftContext._tag === "Some"
      ? giftContext.value.state.data.applicantGifts
      : [];
  const giftDispatch =
    giftContext._tag === "Some" ? giftContext.value.dispatch : undefined;
  const order =
    orderContext._tag === "Some"
      ? orderContext.value.state.data.order
      : undefined;
  const orderDispatch =
    orderContext._tag === "Some" ? orderContext.value.dispatch : undefined;

  // Get eventId from URL parameters
  const pathname = usePathname();
  const eventId = useMemo(() => {
    const match = pathname.match(/\/events\/([^\/]+)/);
    return match ? match[1] : "";
  }, [pathname]);

  // applicantGifts already extracted above

  /**
   * Remove gift action for ControlledBaseTable. Dispatches context action to remove a gift by publicId.
   */
  const removeGiftAction = useMemo(
    () =>
      giftDispatch
        ? (gift: Gift) =>
            giftDispatch({
              type: "REMOVE_GIFT",
              payload: gift.publicId,
            })
        : () => {},
    [giftDispatch]
  );

  // Memoized computed values
  const orderId = useMemo(() => generateOrderId(), []);

  const orderUrl = useMemo(
    () => `${BASE_URL}/events/${eventId}/orders/${orderId}`,
    [eventId, orderId]
  );

  const applicant = useMemo(() => {
    return selectedApplicant._tag === "Some" ? selectedApplicant.value : null;
  }, [selectedApplicant]);

  const applicantDisplayName = useMemo(
    () => applicant?.firstName || "Unknown",
    [applicant?.firstName]
  );

  /**
   * Boolean indicating if the applicant has any gifts selected.
   */
  const hasGifts = useMemo(
    () => applicantGifts.length > 0,
    [applicantGifts.length]
  );

  /**
   * Orchestrates the complete order processing workflow using extracted utilities
   * Provides loading states and error handling with functional patterns
   */
  /**
   * Orchestrates the complete order processing workflow using extracted utilities.
   * Provides loading states and error handling with functional patterns.
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
    // Update order context with applicant and gifts
    if (orderDispatch) {
      orderDispatch({
        type: "UPDATE_ORDER",
        payload: {
          applicant,
          gifts: applicantGifts,
        },
      });
    }
    executeOrderProcess();
  }, [
    applicant,
    isProcessingOrder,
    executeOrderProcess,
    orderDispatch,
    applicantGifts,
  ]);

  /**
   * Utility function to render a gift cell.
   * @param gift {Gift}
   * @returns JSX.Element
   */
  const renderGiftCell = (gift: Gift) => <GiftComponent gift={gift} />;

  /**
   * Utility function to render a remove button cell.
   * @param gift {Gift}
   * @param removeGiftAction {(gift: Gift) => void}
   * @returns JSX.Element
   */
  const renderRemoveButtonCell = (
    gift: Gift,
    removeGiftAction: (gift: Gift) => void
  ) => (
    <SecondaryButton onClick={() => removeGiftAction(gift)}>
      Remove
    </SecondaryButton>
  );

  // Define columns for ControlledBaseTable
  const columns: BaseTableColumn<Gift>[] = useMemo(
    () => [
      {
        header: "Gift",
        accessor: (gift) => renderGiftCell(gift),
      },
      {
        header: "",
        accessor: (gift) => renderRemoveButtonCell(gift, removeGiftAction),
        className: "w-32 text-right",
      },
    ],
    [removeGiftAction]
  );

  /**
   * Renders the complete gift list or empty state message using ControlledBaseTable
   *
   * @returns JSX.Element - Either the gift list or no-gifts message
   */
  const renderGiftsTable = useCallback(() => {
    if (isLoading && applicantGifts.length === 0) {
      return <ListSkeleton title="Selected Gifts" rows={2} columns={2} />;
    }
    if (!hasGifts) {
      return <p>{MESSAGES.NO_GIFTS}</p>;
    }
    return (
      <ControlledBaseTable<Gift>
        initialData={applicantGifts}
        columns={columns}
        onRemove={removeGiftAction}
      />
    );
  }, [isLoading, hasGifts, applicantGifts, columns, removeGiftAction]);

  return (
    <Box sx={GIFT_LIST_STYLES.container}>
      <h3>{applicantDisplayName} gifts:</h3>
      {renderGiftsTable()}
      <StyledButton
        onClick={processOrder}
        disabled={!applicant || isProcessingOrder}
      >
        {isProcessingOrder ? "Processing..." : "Take"}
      </StyledButton>
      {orderError._tag === "Some" && (
        <ErrorMessage message={orderError.value.message} />
      )}
      {/* Add error handling for QR code generation */}
      <QRcode url={orderUrl} qrRef={orderQRCodeRef} />
      {/* Example: Add error message for missing applicant */}
      {!applicant && <ErrorMessage message={MESSAGES.NO_APPLICANT_ERROR} />}
    </Box>
  );
};

export default SelectedGiftList;
