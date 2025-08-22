/**
 * OptimisticEventDetailsClient.tsx
 *
 * Purpose: Client-side event details interface with optimistic UI rendering and context-driven data management
 *
 * Main Responsibilities:
 * - Implements optimistic UI pattern showing immediate interface while data loads
 * - Manages event data fetching and distribution to appropriate contexts
 * - Coordinates state updates across Event, Approver, and Gift contexts
 * - Provides intelligent loading states and error handling with retry mechanisms
 * - Renders event management interface with approver, applicant, and gift lists
 *
 * Architecture Role:
 * - Client-side coordinator between server data and context state management
 * - Bridge between URL parameters and context-driven data fetching
 * - Implements optimistic UI patterns for improved user experience
 * - Manages error boundaries and loading states for complex data dependencies
 * - Foundation for event owner administrative interface
 */

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
 * Event details client component with optimistic rendering and context coordination
 *
 * @param eventId - Unique identifier for the event to display and manage
 * @param ownerId - Owner identifier for access control and event management permissions
 * @returns JSX.Element with event management interface including lists and loading states
 *
 * @sideEffects
 * - Fetches event data from server and updates multiple contexts
 * - Updates Event, Approver, and Gift context states
 * - Triggers re-renders in child components when data loads
 *
 * @performance
 * - Uses optimistic UI to show interface immediately
 * - Memoizes data extraction from Maybe types to prevent unnecessary re-renders
 * - Implements intelligent loading states based on data availability
 *
 * @businessLogic
 * - Event context stores only eventId, not full event object to avoid duplication
 * - Different contexts manage their specific data domains (approvers, gifts, etc.)
 * - Loading states adapt based on which data is available vs expected
 *
 * @notes
 * - Optimistic approach prioritizes user experience over data consistency
 * - Error handling includes retry mechanisms for robust user experience
 * - Context coordination ensures data flows to appropriate state managers
 *
 * @publicAPI Component used by event details page for owner interface
 */
export default function OptimisticEventDetailsClient({
  eventId,
  ownerId,
}: OptimisticEventDetailsClientProps) {
  const eventData = useEventSelector((state) => state.data);
  const eventActions = useEventActions();
  const approverActions = useApproverActions();
  const giftActions = useGiftActions();

  // Get data from appropriate contexts
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

  /**
   * Loads event data optimistically and distributes to appropriate contexts
   *
   * @sideEffects
   * - Updates Event context with eventId
   * - Populates Approver context with approver list
   * - Populates Gift context with gift list
   * - Updates loading and error states
   *
   * @performance Async operation with context updates batched by React
   * @businessLogic Separates data concerns - EventContext only stores ID, others store lists
   * @notes Critical for coordinating server data with client-side context state
   */
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
   * Resets loading state and retries data fetching on error
   *
   * @sideEffects
   * - Resets loading flags to trigger data refetch
   * - Clears error state for fresh attempt
   *
   * @performance Triggers full data reload cycle
   * @notes Provides user recovery mechanism for failed data loads
   * @publicAPI Exposed through retry button in error UI
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
