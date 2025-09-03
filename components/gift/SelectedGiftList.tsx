/**
 * SelectedGiftList.tsx
 *
 * Purpose:
 * - Displays and manages a list of gifts for the selected applicant.
 * - Allows removal of gifts and processes orders.
 * - Integrates with context for applicant, gift, and order state.
 * - Uses format-driven columns for maintainable, dynamic table rendering.
 *
 * Responsibilities:
 * - Context-driven state management and safe access patterns.
 * - Memoized computations for performance.
 * - Error handling for QR code generation and order submission.
 * - No UI or styling changes; only code quality and structure improvements.
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
import { BaseTableColumn } from "@/ui/table/BaseTable";
import { ControlledBaseTable } from "@/ui/table/ControlledBaseTable";
import { buildGiftTableColumns } from "@/ui/table/columnBuilder";
import { ExcelFormatType } from "@/types/excel.types";
import { useOrderContext } from "@/app/contexts/order/OrderContext";
import ErrorMessage from "../ui/ErrorMessage";

// Component styles and messages
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
 * Renders a list of gifts for the selected applicant with removal functionality and order processing.
 * Integrates with multiple contexts to manage applicant and gift state.
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

  /**
   * Extracts the list of gifts for the selected applicant from context.
   * @returns Gift[]
   */
  const applicantGifts = useMemo(
    () =>
      giftContext._tag === "Some"
        ? giftContext.value.state.data.applicantGifts
        : [],
    [giftContext]
  );

  /**
   * Extracts the dispatch function for gift actions from context.
   * @returns Dispatch function or undefined
   */
  const giftDispatch =
    giftContext._tag === "Some" ? giftContext.value.dispatch : undefined;

  /**
   * Extracts the order object from context.
   * @returns Order or undefined
   */
  const order =
    orderContext._tag === "Some"
      ? orderContext.value.state.data.order
      : undefined;

  /**
   * Extracts the dispatch function for order actions from context.
   * @returns Dispatch function or undefined
   */
  const orderDispatch =
    orderContext._tag === "Some" ? orderContext.value.dispatch : undefined;

  /**
   * Extracts the eventId from the current URL pathname.
   * @returns string
   */
  const pathname = usePathname();
  const eventId = useMemo(() => {
    const match = pathname.match(/\/events\/([^\/]+)/);
    return match ? match[1] : "";
  }, [pathname]);

  // applicantGifts already extracted above

  /**
   * Returns a function to remove a gift by publicId using context dispatch.
   * @returns (gift: Gift) => void
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

  /**
   * Generates a unique order ID for the order.
   * @returns string
   */
  const orderId = useMemo(() => generateOrderId(), []);

  /**
   * Constructs the order URL for QR code generation.
   * @returns string
   */
  const orderUrl = useMemo(
    () => `${BASE_URL}/events/${eventId}/orders/${orderId}`,
    [eventId, orderId]
  );

  /**
   * Extracts the applicant object from context.
   * @returns Person or null
   */
  const applicant = useMemo(() => {
    return selectedApplicant._tag === "Some" ? selectedApplicant.value : null;
  }, [selectedApplicant]);

  /**
   * Gets the display name for the applicant.
   * @returns string
   */
  const applicantDisplayName = useMemo(
    () => applicant?.firstName || "Unknown",
    [applicant?.firstName]
  );

  /**
   * Returns true if the applicant has any gifts selected.
   * @returns boolean
   */
  const hasGifts = useMemo(
    () => applicantGifts.length > 0,
    [applicantGifts.length]
  );

  /**
   * Handles the complete order processing workflow using extracted utilities.
   * Navigates to the order page on success, throws error on failure.
   * @returns Promise<string> - The public ID of the created order
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
      const result = await processCompleteOrder(
        applicant,
        applicantGifts,
        orderId,
        orderQRCodeRef
      );
      if (result._tag === "Failure") {
        throw result.error;
      }
      router.push(`/events/${eventId}/orders/${orderId}`);
      return result.value;
    },
    {
      deps: [applicant, applicantGifts, eventId, orderId],
      maxRetries: 1,
    }
  );

  /**
   * Initiates the order processing workflow.
   * Updates order context and triggers async order creation.
   * @returns void
   */
  const processOrder = useCallback(() => {
    if (!applicant || isProcessingOrder) return;
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
   * Renders a gift cell using the GiftComponent.
   * @param gift {Gift}
   * @returns JSX.Element
   */
  const renderGiftCell = (gift: Gift) => <GiftComponent gift={gift} />;

  /**
   * Renders a remove button cell for a gift.
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

  /**
   * Generates table columns for gifts using format-driven logic and adds a custom remove button column.
   * @returns BaseTableColumn<Gift>[]
   */
  const ownerFormat: ExcelFormatType | undefined =
    applicantGifts.length > 0
      ? applicantGifts[0].owner?.sourceFormat
      : undefined;
  const applicantFormat: ExcelFormatType | undefined =
    applicantGifts.length > 0 && applicantGifts[0].applicant
      ? applicantGifts[0].applicant.sourceFormat
      : undefined;
  const formatColumns: BaseTableColumn<Gift>[] = useMemo(() => {
    if (!ownerFormat) return [];
    return buildGiftTableColumns(ownerFormat, applicantFormat).map((col) => ({
      header: col.label,
      accessor: (gift: Gift) => (col.getValue ? col.getValue(gift) : ""),
      className: col.width,
    }));
  }, [ownerFormat, applicantFormat, applicantGifts]);

  const columns: BaseTableColumn<Gift>[] = useMemo(
    () => [
      ...formatColumns,
      {
        header: "",
        accessor: (gift) => renderRemoveButtonCell(gift, removeGiftAction),
        className: "w-32 text-right",
      },
    ],
    [formatColumns, removeGiftAction]
  );

  /**
   * Renders the complete gift list or empty state message using ControlledBaseTable.
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
