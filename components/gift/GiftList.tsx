import React from "react";
import { Gift } from "@/database/models/gift.model";
import ErrorMessage from "@/ui/form/ErrorMessage";
import SortableFilterableTable, {
  TableColumn,
} from "@/components/ui/SortableFilterableTable";

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
  // Define table columns for gifts
  const columns: TableColumn<Gift>[] = React.useMemo(
    () => [
      {
        key: "owner",
        label: "Owner",
        sortable: true,
        filterable: true,
        getValue: (gift: Gift) =>
          gift.owner
            ? `${gift.owner.firstName} ${gift.owner.lastName}`
            : "Unknown Owner",
        render: (gift: Gift) => (
          <span>
            {gift.owner
              ? `${gift.owner.firstName} ${gift.owner.lastName}`
              : "Unknown Owner"}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        getValue: (gift: Gift) => (gift.applicant ? "Claimed" : "Available"),
        render: (gift: Gift) => (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              gift.applicant
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {gift.applicant ? "Claimed" : "Available"}
          </span>
        ),
      },
      {
        key: "applicant",
        label: "Claimed By",
        sortable: true,
        filterable: true,
        getValue: (gift: Gift) =>
          gift.applicant
            ? `${gift.applicant.firstName} ${gift.applicant.lastName}`
            : "",
        render: (gift: Gift) => (
          <span className="text-gray-600">
            {gift.applicant
              ? `${gift.applicant.firstName} ${gift.applicant.lastName}`
              : "-"}
          </span>
        ),
      },
    ],
    []
  );

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
      rowKey={(gift, index) => gift.publicId || `gift-${index}`}
    />
  );
};

// Add display name for debugging
GiftList.displayName = "GiftList";

export default GiftList;
