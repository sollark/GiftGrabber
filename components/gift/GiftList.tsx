import React from "react";
import { Gift } from "@/database/models/gift.model";
import SortableFilterableTable from "@/ui/table/SortableFilterableTable";
import { buildGiftTableColumns } from "@/ui/table/columnBuilder";
import ErrorMessage from "../ui/ErrorMessage";

interface GiftListProps {
  giftList: Gift[];
  isLoading?: boolean;
  showLoadingWhenEmpty?: boolean;
  error?: string | null;
}

/**
 * GiftList component displays all gifts with their ownership and claim status.
 * Shows context data immediately, only shows loading when specifically needed.
 * Includes error handling for robust user experience.
 * Uses sortable and filterable table for better user experience.
 *
 * @param giftList - Array of Gift objects to display
 * @param isLoading - Whether data is currently being fetched from server
 * @param showLoadingWhenEmpty - Whether to show loading when list is empty (for new events)
 * @param error - Error message to display if gift loading fails
 * @returns JSX.Element rendering gift list, empty state, loading state, or error state
 */
const GiftList: React.FC<GiftListProps> = ({
  giftList,
  isLoading = false,
  showLoadingWhenEmpty = false,
  error = null,
}) => {
  // Determine formats for owner and applicant
  const ownerFormat =
    giftList.length > 0 ? giftList[0].owner?.sourceFormat : undefined;
  const applicantFormat =
    giftList.length > 0 && giftList[0].applicant
      ? giftList[0].applicant.sourceFormat
      : undefined;
  const columns = ownerFormat
    ? buildGiftTableColumns(ownerFormat, applicantFormat)
    : [];

  // Show error state if there's an error
  if (error) {
    return <ErrorMessage message={"Error loading gifts: " + error} />;
  }

  return (
    <SortableFilterableTable<Gift>
      data={giftList}
      columns={columns}
      isLoading={isLoading && showLoadingWhenEmpty}
      title="Gifts"
      emptyMessage="No gifts available"
      searchPlaceholder="Search gifts by owner, status, or applicant..."
      rowKey={(gift) => gift.publicId}
    />
  );
};

export default GiftList;
