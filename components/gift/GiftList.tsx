import React from "react";
import { Gift } from "@/database/models/gift.model";
import ListSkeleton from "@/components/ui/ListSkeleton";
import ErrorMessage from "@/ui/form/ErrorMessage";

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
 * Uses React's built-in rendering optimizations without React.memo.
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
  // Memoized gift rows for performance
  const giftRows = React.useMemo(
    () =>
      giftList.map((gift: Gift, index: number) => (
        <tr key={gift.publicId || index} className="border-b border-gray-100">
          <td className="py-2 px-3">
            {gift.owner
              ? `${gift.owner.firstName} ${gift.owner.lastName}`
              : "Unknown Owner"}
          </td>
          <td className="py-2 px-3">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                gift.applicant
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {gift.applicant ? "Claimed" : "Available"}
            </span>
          </td>
        </tr>
      )),
    [giftList]
  );
  // Show error state if there's an error
  if (error) {
    return <ErrorMessage message={"Error loading gifts: " + error} />;
  }

  // Show loading only if actively loading AND no data available AND expected to load
  if (isLoading && giftList.length === 0 && showLoadingWhenEmpty) {
    return <ListSkeleton title="Gifts" rows={3} columns={2} />;
  }

  return (
    <div>
      <h3>Gifts</h3>
      {giftList.length === 0 ? (
        <div className="text-gray-500 text-sm">No gifts available</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">Owner</th>
                <th className="text-left py-2 px-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>{giftRows}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Add display name for debugging
GiftList.displayName = "GiftList";

export default GiftList;
