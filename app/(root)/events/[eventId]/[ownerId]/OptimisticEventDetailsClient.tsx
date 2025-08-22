"use client";

import React from "react";
import { useEventSelector, useEventActions } from "@/app/contexts/EventContext";
import {
  useApproverActions,
  useApproverSelector,
} from "@/app/contexts/ApproverContext";
import { useApplicantSelector } from "@/app/contexts/ApplicantContext";
import {
  useGiftActions,
  useGiftSelector,
} from "@/app/contexts/gift/GiftContext";
import ApproverList from "@/components/approver/ApproverList";
import ApplicantList from "@/components/applicant/ApplicantList";
import GiftList from "@/components/gift/GiftList";
import ListSkeleton from "@/components/ui/ListSkeleton";
import { getEventDetails } from "@/app/actions/event.action";

interface OptimisticEventDetailsClientProps {
  eventId: string;
  ownerId: string;
}

/**
 * OptimisticEventDetailsClient displays event information using 3 list components.
 * Shows all data immediately from context (optimistic approach).
 * Only shows loading for gifts when they're expected but not yet available.
 *
 * @param eventId - Event identifier for data fetching
 * @param ownerId - Owner identifier for the event
 * @returns JSX.Element with 3 list components
 */
export default function OptimisticEventDetailsClient({
  eventId,
  ownerId,
}: OptimisticEventDetailsClientProps) {
  const eventData = useEventSelector((state) => state.data);
  const eventActions = useEventActions();
  const approverActions = useApproverActions();
  const giftActions = useGiftActions();

  // Get data from appropriate contexts - not from EventContext
  const applicantListMaybe = useApplicantSelector(
    (state) => state.data.applicantList
  );
  const approverListMaybe = useApproverSelector(
    (state) => state.data.approverList
  );
  const giftListMaybe = useGiftSelector((state) => state.data.giftList);

  const [isLoading, setIsLoading] = React.useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Extract data from Maybe types with fallbacks
  const applicantList = React.useMemo(
    () => (applicantListMaybe._tag === "Some" ? applicantListMaybe.value : []),
    [applicantListMaybe]
  );
  const giftList = React.useMemo(
    () => (giftListMaybe._tag === "Some" ? giftListMaybe.value : []),
    [giftListMaybe]
  );
  const approverList = React.useMemo(
    () => (approverListMaybe._tag === "Some" ? approverListMaybe.value : []),
    [approverListMaybe]
  );

  // Determine loading states for different components
  const shouldShowGiftLoading =
    isLoading &&
    !initialLoadComplete &&
    applicantList.length > 0 &&
    giftList.length === 0;

  const isInitialLoad = isLoading && !initialLoadComplete;
  const hasNoData =
    applicantList.length === 0 &&
    approverList.length === 0 &&
    giftList.length === 0;

  // Load data optimistically - update context when server data arrives
  React.useEffect(() => {
    const loadData = async () => {
      setError(null); // Clear previous errors

      // Set event ID immediately in context
      if (eventActions._tag === "Some") {
        eventActions.value.dispatchSafe({
          type: "SET_EVENT_ID",
          payload: eventId,
        });
      }

      try {
        const event = await getEventDetails(eventId);
        if (event) {
          // EventContext only stores eventId - not the full event object
          if (eventActions._tag === "Some") {
            eventActions.value.dispatchSafe({
              type: "SET_EVENT_ID",
              payload: eventId, // Only pass the eventId string
            });
          }

          if (approverActions._tag === "Some") {
            approverActions.value.dispatchSafe({
              type: "SET_EVENT_APPROVERS",
              payload: { approverList: event.approverList || [] },
            });
          }

          if (giftActions._tag === "Some") {
            giftActions.value.dispatchSafe({
              type: "SET_GIFT_LIST",
              payload: event.giftList || [],
            });
          }
        } else {
          setError("Event not found");
        }
      } catch (error) {
        console.error("Failed to load event data:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load event data"
        );
      } finally {
        setIsLoading(false);
        setInitialLoadComplete(true);
      }
    };

    loadData();
  }, [eventId, eventActions, approverActions, giftActions]);

  /**
   * Retry data loading when error occurs
   */
  const handleRetry = React.useCallback(() => {
    setIsLoading(true);
    setInitialLoadComplete(false);
    setError(null);
  }, []);

  return (
    <div>
      <h1>Event Details</h1>

      {/* Loading indicator */}
      {isLoading && (
        <div className="text-blue-600 mb-4">Syncing with server...</div>
      )}

      {/* Error handling with retry */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="text-red-800 font-semibold mb-2">
            Error Loading Event Data
          </div>
          <div className="text-red-600 mb-3">{error}</div>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Data lists - show skeletons during initial load or context data */}
      <div className="space-y-6">
        {isInitialLoad && hasNoData ? (
          <>
            <ListSkeleton title="Approvers" rows={2} columns={1} />
            <ListSkeleton title="Applicants" rows={4} columns={1} />
            <ListSkeleton title="Gifts" rows={4} columns={2} />
          </>
        ) : (
          <>
            <ApproverList personArray={approverList} isLoading={isLoading} />
            <ApplicantList personArray={applicantList} isLoading={isLoading} />
            <GiftList
              giftList={giftList}
              isLoading={isLoading}
              showLoadingWhenEmpty={shouldShowGiftLoading}
            />
          </>
        )}
      </div>
    </div>
  );
}
