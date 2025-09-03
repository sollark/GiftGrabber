/**
 * SelectedGiftList.tsx
 *
 * Purpose: Renders and manages the list of gifts for the selected applicant, including removal and order processing.
 * Responsibilities:
 *   - Integrates with applicant, gift, and order contexts.
 *   - Handles order creation and navigation.
 *   - Renders a table of selected gifts with removal actions.
 *   - Provides error handling and loading states.
 *   - No UI or styling changes; only code quality and structure improvements.
 */

import React, { FC, useRef, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box } from "@mui/material";
import { processCompleteOrder } from "@/utils/orderProcessing";
import { useSelectedApplicant } from "@/app/contexts/ApplicantContext";
import { useGiftContext } from "@/app/contexts/gift/GiftContext";
import { Gift } from "@/database/models/gift.model";
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

// Styles and messages used in the component
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
 * SelectedGiftListProps
 * Props for SelectedGiftList component.
 * @property isLoading - Whether the component is in a loading state
 */
export interface SelectedGiftListProps {
  isLoading?: boolean;
}

/**
 * SelectedGiftList
 * Main component for displaying and managing the selected gifts for an applicant.
 * @param isLoading - Whether the component is in a loading state
 * @returns JSX.Element
 */
const SelectedGiftList: FC<SelectedGiftListProps> = ({ isLoading = false }) => {
  const router = useRouter();
  const orderQRCodeRef = useRef<HTMLDivElement>(null!);

  // Context state selectors
  const selectedApplicant = useSelectedApplicant();
  const giftContext = useGiftContext();
  const orderContext = useOrderContext();

  /**
   * applicantGifts
   * Extracts the list of gifts for the selected applicant from context.
   */
  const applicantGifts = useMemo(
    () => giftContext.state.data.applicantGifts,
    [giftContext]
  );

  /**
   * giftDispatch
   * Dispatch function for gift actions from context.
   */
  const giftDispatch = giftContext.dispatch;

  /**
   * order
   * Extracts the order object from context.
   */
  const order = useMemo(() => orderContext?.state?.data?.order, [orderContext]);

  /**
   * orderDispatch
   * Dispatch function for order actions from context.
   */
  const orderDispatch = orderContext?.dispatch;

  /**
   * eventId
   * Extracts the eventId from the current URL pathname.
   */
  const pathname = usePathname();
  const eventId = useMemo(() => {
    const match = pathname.match(/\/events\/([^\/]+)/);
    return match ? match[1] : "";
  }, [pathname]);

  /**
   * removeGiftAction
   * Returns a function to remove a gift by publicId using context dispatch.
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
   * publicOrderId
   * Gets the order ID from context if available, otherwise generates a new one.
   */
  const publicOrderId = useMemo(() => order.publicOrderId, [order]);

  /**
   * orderUrl
   * Constructs the order URL for QR code generation.
   */
  const orderUrl = useMemo(
    () => `${BASE_URL}/events/${eventId}/orders/${publicOrderId}`,
    [eventId, publicOrderId]
  );

  /**
   * applicant
   * Extracts the applicant object from context.
   */
  const applicant = useMemo(() => {
    return selectedApplicant._tag === "Some" ? selectedApplicant.value : null;
  }, [selectedApplicant]);

  /**
   * applicantDisplayName
   * Gets the display name for the applicant.
   */
  const applicantDisplayName = useMemo(
    () => applicant?.firstName || "Unknown",
    [applicant?.firstName]
  );

  /**
   * hasGifts
   * Returns true if the applicant has any gifts selected.
   */
  const hasGifts = useMemo(
    () => applicantGifts.length > 0,
    [applicantGifts.length]
  );

  /**
   * useSafeAsync for order processing
   * Handles the complete order processing workflow using extracted utilities.
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
        publicOrderId,
        orderQRCodeRef
      );
      if (result._tag === "Failure") {
        throw result.error;
      }
      router.push(`/events/${eventId}/orders/${publicOrderId}`);
      return result.value;
    },
    {
      deps: [applicant, applicantGifts, eventId, publicOrderId],
      maxRetries: 1,
    }
  );

  /**
   * processOrder
   * Initiates the order processing workflow.
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
   * renderGiftCell
   * Renders a gift cell using the GiftComponent.
   */
  const renderGiftCell = (gift: Gift) => <GiftComponent gift={gift} />;

  /**
   * renderRemoveButtonCell
   * Renders a remove button cell for a gift.
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
   * formatColumns
   * Generates table columns for gifts using format-driven logic and adds a custom remove button column.
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

  /**
   * columns
   * Table columns including the remove button column.
   */
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
   * renderGiftsTable
   * Renders the complete gift list or empty state message using ControlledBaseTable.
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
